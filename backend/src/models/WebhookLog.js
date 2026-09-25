const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    url: { type: String, required: true },
    statusCode: { type: Number, default: null },
    success: { type: Boolean, default: false },
    responseSnippet: { type: String, default: null },
    attempt: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
