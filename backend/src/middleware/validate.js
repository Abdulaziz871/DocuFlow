const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator chains; turns validation errors into a clean 400 ApiError.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array()));
  }
  next();
}

module.exports = validate;
