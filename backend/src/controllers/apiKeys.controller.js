const ApiKey = require('../models/ApiKey');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/v1/api-keys  (system_admin or operations_manager)
// The raw key is returned ONCE at creation time and never again.
const createApiKey = asyncHandler(async (req, res) => {
  const { label } = req.body;
  const { raw, hash, prefix } = ApiKey.generateKey();

  const apiKey = await ApiKey.create({
    label,
    company: req.user.company,
    createdBy: req.user._id,
    keyPrefix: prefix,
    keyHash: hash,
  });

  res.status(201).json({
    success: true,
    data: { id: apiKey._id, label: apiKey.label, keyPrefix: apiKey.keyPrefix, apiKey: raw },
    warning: 'This is the only time the full API key is shown. Store it securely.',
  });
});

// GET /api/v1/api-keys
const listApiKeys = asyncHandler(async (req, res) => {
  const keys = await ApiKey.find({ company: req.user.company }).sort({ createdAt: -1 });
  res.json({ success: true, data: keys });
});

// DELETE /api/v1/api-keys/:id  (revoke)
const revokeApiKey = asyncHandler(async (req, res) => {
  const key = await ApiKey.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company },
    { isActive: false, revokedAt: new Date() },
    { new: true }
  );
  if (!key) throw new ApiError(404, 'API key not found.');
  res.json({ success: true, data: key });
});

module.exports = { createApiKey, listApiKeys, revokeApiKey };
