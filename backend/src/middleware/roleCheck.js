const ApiError = require('../utils/ApiError');

// Usage: router.post('/x', protect, allowRoles('system_admin', 'operations_manager'), handler)
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

module.exports = { allowRoles };
