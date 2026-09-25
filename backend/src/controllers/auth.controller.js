const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role, company: user.company }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
}

// POST /api/v1/auth/register
// Creates the first user of a new company as an operations_manager by default.
// (System admins are seeded/created separately, not self-registered.)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, companyName } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered.');

  const company = await Company.create({ name: companyName || `${name}'s Company` });
  const user = await User.create({ name, email, password, role: 'operations_manager', company: company._id });

  const token = signToken(user);
  res.status(201).json({ success: true, data: { user: user.toSafeJSON(), token } });
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated.');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  res.json({ success: true, data: { user: user.toSafeJSON(), token } });
});

// GET /api/v1/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

module.exports = { register, login, me };
