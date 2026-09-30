const fs = require('fs');
const Document = require('../models/Document');
const Company = require('../models/Company');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ocrService = require('../services/ocr.service');
const geminiService = require('../services/gemini.service');
const rulesEngine = require('../services/rulesEngine.service');
const webhookService = require('../services/webhook.service');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Core pipeline, steps 2-5 from the spec:
 * OCR extraction -> Gemini structured extraction -> rules engine -> save + webhook notify.
 * Shared by both the dashboard upload route (JWT) and the external ingestion route (API key).
 */
async function processDocument(doc) {
  try {
    doc.status = 'ocr_processing';
    await doc.save();
    const rawText = await ocrService.extractText(doc.storagePath, doc.mimeType);
    doc.rawText = rawText;

    doc.status = 'ai_extracting';
    await doc.save();
    const extractedData = await geminiService.extractStructuredData(rawText, { path: doc.storagePath, mimeType: doc.mimeType });
    doc.extractedData = extractedData;
    doc.documentType = extractedData.documentType || 'other';

    doc.status = 'rules_processing';
    await doc.save();
    const matches = await rulesEngine.applyRules(doc.company, doc.documentType, extractedData);
    doc.matchedRules = matches.map((m) => ({ rule: m.rule._id, actionsTaken: m.actionsTaken }));

    const requiresApproval = matches.some((m) => m.actionsTaken.includes('requireApproval'));
    doc.status = requiresApproval ? 'needs_review' : 'completed';
    await doc.save();

    const company = await Company.findById(doc.company);
    company.usage.documentsProcessed += 1;
    await company.save();

    const result = await webhookService.notifyWebhook({ company, document: doc });
    doc.webhookNotified = !!result.success;
    await doc.save();

    // "sendEmailAlert" rules — e.g. "if totalAmount > 5000, email me" — fire here,
    // independent of the general webhook notification above.
    const emailAlertRules = matches.filter((m) => m.actionsTaken.includes('sendEmailAlert'));
    if (emailAlertRules.length) {
      await emailService.sendRuleMatchAlert({ company, document: doc, ruleNames: emailAlertRules.map((m) => m.rule.name) });
    }
  } catch (err) {
    logger.error(`Document processing failed [${doc._id}]: ${err.message}`);
    doc.status = 'failed';
    doc.errorMessage = err.message;
    await doc.save();

    // Failures are exactly when a downstream system most needs to hear about it —
    // notify the same webhook URL with a document.failed event instead of staying silent.
    const company = await Company.findById(doc.company);
    if (company) {
      const result = await webhookService.notifyWebhook({ company, document: doc });
      doc.webhookNotified = !!result.success;
      await doc.save();
      await emailService.sendFailureAlert({ company, document: doc });
    }
  }
  // /tmp on Vercel is small and per-instance; nothing reads the file after processing.
  if (process.env.VERCEL) fs.rm(doc.storagePath, { force: true }, () => {});
  return doc;
}

// POST /api/v1/documents/upload  (dashboard, JWT-authenticated)
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded. Field name must be "file".');

  let doc = await Document.create({
    company: req.user.company,
    uploadedBy: req.user._id,
    originalFileName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    storagePath: req.file.path,
  });

  doc = await processDocument(doc);
  await doc.populate('matchedRules.rule', 'name');
  res.status(201).json({ success: true, data: doc });
});

// POST /api/v1/ingest  (external system / developer, API-key-authenticated)
const ingestDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded. Field name must be "file".');

  let doc = await Document.create({
    company: req.company._id,
    uploadedViaApiKey: req.apiKey._id,
    originalFileName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    storagePath: req.file.path,
  });

  doc = await processDocument(doc);
  await doc.populate('matchedRules.rule', 'name');

  // Synchronous response for MVP simplicity; swap for 202 + webhook-only for large files/scale.
  res.status(201).json({ success: true, data: doc });
});

const IN_PROGRESS_STATUSES = ['received', 'ocr_processing', 'ai_extracting', 'rules_processing'];
const STALE_AFTER_MS = 10 * 60 * 1000;

// If the function running processDocument is killed (timeout, crash), the document stays
// mid-pipeline forever and the dashboard keeps polling it; mark those as failed.
function failStaleDocuments(filter) {
  return Document.updateMany(
    { ...filter, status: { $in: IN_PROGRESS_STATUSES }, updatedAt: { $lt: new Date(Date.now() - STALE_AFTER_MS) } },
    { status: 'failed', errorMessage: 'Processing timed out. Please upload the file again.' }
  );
}

// GET /api/v1/documents
const listDocuments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { company: req.user.company };
  await failStaleDocuments(filter);
  if (status) filter.status = status;

  const documents = await Document.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Document.countDocuments(filter);
  res.json({ success: true, data: documents, meta: { total, page: Number(page), limit: Number(limit) } });
});

// GET /api/v1/documents/:id
const getDocument = asyncHandler(async (req, res) => {
  await failStaleDocuments({ _id: req.params.id, company: req.user.company });
  const doc = await Document.findOne({ _id: req.params.id, company: req.user.company }).populate('matchedRules.rule', 'name');
  if (!doc) throw new ApiError(404, 'Document not found.');
  res.json({ success: true, data: doc });
});

// PATCH /api/v1/documents/:id/review  (Operations Manager approves/edits extracted data)
const reviewDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, company: req.user.company });
  if (!doc) throw new ApiError(404, 'Document not found.');

  if (req.body.extractedData) doc.extractedData = req.body.extractedData;
  doc.status = 'completed';
  doc.reviewedBy = req.user._id;
  doc.reviewedAt = new Date();
  await doc.save();
  await doc.populate('matchedRules.rule', 'name');

  res.json({ success: true, data: doc });
});

module.exports = { uploadDocument, ingestDocument, listDocuments, getDocument, reviewDocument };
