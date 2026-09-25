const axios = require('axios');
const Company = require('../models/Company');
const WebhookLog = require('../models/WebhookLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { webhookTimeoutMs, resendApiKey } = require('../config/env');
const { sendFailureAlert } = require('../services/email.service');

// GET /api/v1/company
const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.user.company);
  res.json({ success: true, data: company });
});

// PATCH /api/v1/company  { name?, webhookUrl?, alertEmail? }
const updateCompany = asyncHandler(async (req, res) => {
  const { name, webhookUrl, alertEmail } = req.body;
  const update = {};

  if (name !== undefined) update.name = name;
  if (webhookUrl !== undefined) {
    if (webhookUrl && !/^https?:\/\//i.test(webhookUrl)) {
      throw new ApiError(400, 'رابط الـ Webhook يجب أن يبدأ بـ http:// أو https://');
    }
    update.webhookUrl = webhookUrl || null;
  }
  if (alertEmail !== undefined) {
    if (alertEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmail)) {
      throw new ApiError(400, 'صيغة البريد الإلكتروني غير صحيحة.');
    }
    update.alertEmail = alertEmail || null;
  }

  const company = await Company.findByIdAndUpdate(req.user.company, update, { new: true, runValidators: true });
  res.json({ success: true, data: company });
});

// POST /api/v1/company/webhook-test — fires a synthetic event at the saved URL right now,
// without needing to upload a real document. Not persisted as a WebhookLog (it's a dry run).
const sendTestWebhook = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.user.company);
  if (!company.webhookUrl) throw new ApiError(400, 'لا يوجد رابط Webhook محفوظ بعد — احفظه أولاً.');

  const payload = {
    event: 'document.processed',
    documentId: 'test-event',
    status: 'completed',
    documentType: 'invoice',
    extractedData: { vendorName: 'شركة تجريبية', totalAmount: 1000, currency: 'SAR' },
    matchedRules: [],
    timestamp: new Date().toISOString(),
    test: true,
  };

  try {
    const response = await axios.post(company.webhookUrl, payload, { timeout: webhookTimeoutMs });
    res.json({ success: true, data: { delivered: true, statusCode: response.status } });
  } catch (err) {
    res.json({
      success: true,
      data: { delivered: false, statusCode: err.response?.status || null, error: err.message },
    });
  }
});

// POST /api/v1/company/email-test — sends a real "document failed" sample email right now.
const sendTestEmail = asyncHandler(async (req, res) => {
  if (!resendApiKey) {
    throw new ApiError(400, 'ميزة الإيميل غير مفعّلة على الخادم بعد — أضِف RESEND_API_KEY في backend/.env أولاً.');
  }
  const company = await Company.findById(req.user.company);
  if (!company.alertEmail) throw new ApiError(400, 'لا يوجد بريد تنبيهات محفوظ بعد — احفظه أولاً.');

  const fakeDocument = { originalFileName: 'فاتورة-تجريبية.pdf', errorMessage: 'هذه رسالة اختبار — لا يوجد خطأ فعلي.' };
  const result = await sendFailureAlert({ company, document: fakeDocument });

  if (result.skipped) throw new ApiError(400, `تعذّر الإرسال: ${result.reason}`);
  res.json({ success: true, data: result });
});

// GET /api/v1/company/webhook-logs — real delivery history from actual document processing.
const listWebhookLogs = asyncHandler(async (req, res) => {
  const logs = await WebhookLog.find({ company: req.user.company }).sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, data: logs });
});

module.exports = { getCompany, updateCompany, sendTestWebhook, sendTestEmail, listWebhookLogs };
