const multer = require('multer');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message;
    err = new ApiError(400, message);
  } else if (err.name === 'ValidationError') {
    err = new ApiError(400, Object.values(err.errors).map((e) => e.message).join(' '));
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || undefined,
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
