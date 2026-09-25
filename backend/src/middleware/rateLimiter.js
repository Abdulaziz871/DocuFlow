const rateLimit = require('express-rate-limit');
const { rateLimitWindowMs, rateLimitMax } = require('../config/env');

// General API limiter applied globally.
const apiLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Tighter limiter on auth routes to slow down credential stuffing / brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// Per-API-key limiter for the ingestion endpoint (external systems/developers).
const ingestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.apiKey?.id || req.ip,
  message: { success: false, message: 'Upload rate limit exceeded for this API key.' },
});

module.exports = { apiLimiter, authLimiter, ingestionLimiter };
