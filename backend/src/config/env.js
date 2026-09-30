// Centralized environment configuration.
// Fails fast if a required variable is missing so the service never boots half-configured.
require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

if (process.env.NODE_ENV !== 'test') {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',

  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 300,

  webhookTimeoutMs: Number(process.env.WEBHOOK_TIMEOUT_MS) || 5000,

  // Optional: email alerts are skipped (not a boot error) when this is unset — see email.service.js.
  resendApiKey: process.env.RESEND_API_KEY || null,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'DocuFlow AI <onboarding@resend.dev>',
};
