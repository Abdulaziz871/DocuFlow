const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    uploadedViaApiKey: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey', default: null },

    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },

    status: {
      type: String,
      enum: ['received', 'ocr_processing', 'ai_extracting', 'rules_processing', 'completed', 'failed', 'needs_review'],
      default: 'received',
    },
    errorMessage: { type: String, default: null },

    rawText: { type: String, default: null }, // OCR / parsed text
    extractedData: { type: mongoose.Schema.Types.Mixed, default: null }, // structured JSON from Gemini
    documentType: { type: String, default: null }, // inferred type, e.g. "invoice"

    matchedRules: [
      {
        rule: { type: mongoose.Schema.Types.ObjectId, ref: 'Rule' },
        actionsTaken: [{ type: String }],
      },
    ],

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },

    webhookNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ company: 1, createdAt: -1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);
