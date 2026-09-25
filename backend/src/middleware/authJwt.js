const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the JWT sent from the frontend dashboard (Admin / Operations Manager sessions).
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated. Missing bearer token.');
  }

  const token = header.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User no longer active.');
  }

  req.user = user;
  next();
});

module.exports = { protect };
