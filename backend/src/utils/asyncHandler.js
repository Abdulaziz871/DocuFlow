// Wraps an async route/controller so rejected promises are forwarded to Express's error handler
// instead of crashing the process with an unhandled rejection.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
