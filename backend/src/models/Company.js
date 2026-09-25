const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    webhookUrl: { type: String, default: null }, // where processed-document notifications are POSTed
    alertEmail: { type: String, default: null }, // where document.failed alerts are emailed
    usage: {
      documentsProcessed: { type: Number, default: 0 },
      apiCallsThisMonth: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
