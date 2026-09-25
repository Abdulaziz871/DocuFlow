const ApiKey = require('../models/ApiKey');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the x-api-key header used by external systems / developer integrations
// hitting the ingestion endpoint directly, as opposed to dashboard JWT auth.
const protectApiKey = asyncHandler(async (req, res, next) => {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) {
    throw new ApiError(401, 'Missing x-api-key header.');
  }

  const keyHash = ApiKey.hash(rawKey);
  const apiKey = await ApiKey.findOne({ keyHash, isActive: true }).select('+keyHash').populate('company');

  if (!apiKey) {
    throw new ApiError(401, 'Invalid or revoked API key.');
  }

  apiKey.lastUsedAt = new Date();
  await apiKey.save();

  req.apiKey = apiKey;
  req.company = apiKey.company;
  next();
});

module.exports = { protectApiKey };
