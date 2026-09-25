const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/v1/users  (system_admin: all users in their scope; here scoped by company for simplicity)
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ company: req.user.company }).select('-password');
  res.json({ success: true, data: users });
});

// PATCH /api/v1/users/:id/role  (system_admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company },
    { role },
    { new: true }
  ).select('-password');
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, data: user });
});

// PATCH /api/v1/users/:id/deactivate  (system_admin only)
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company },
    { isActive: false },
    { new: true }
  ).select('-password');
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, data: user });
});

module.exports = { listUsers, updateUserRole, deactivateUser };
