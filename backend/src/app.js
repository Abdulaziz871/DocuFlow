const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { clientUrl } = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Behind Vercel's proxy; without this req.ip is the proxy's IP and every user shares one rate-limit bucket.
app.set('trust proxy', 1);

// ---- Security & core middleware ----
app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

// ---- Health check ----
app.get('/health', (req, res) => res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() }));

// ---- API routes ----
app.use('/api/v1', routes);

// ---- 404 + error handler (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
