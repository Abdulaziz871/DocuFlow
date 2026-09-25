const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    keyPrefix: { type: String, required: true }, // shown in UI e.g. "dfa_live_9f2a"
    keyHash: { type: String, required: true, select: false }, // sha256 of the full key, never store plaintext
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

apiKeySchema.statics.generateKey = function generateKey() {
  const raw = `dfa_live_${crypto.randomBytes(24).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, 14); // e.g. dfa_live_9f2a
  return { raw, hash, prefix };
};

apiKeySchema.statics.hash = function hash(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
