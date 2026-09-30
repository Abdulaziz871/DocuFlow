const winston = require('winston');

// Vercel's deployment filesystem is read-only outside of os.tmpdir(), so
// winston's File transport (which writes to a relative "logs/" dir) can't
// be used there — stdout/stderr already reach `vercel logs` on its own.
const transports = [new winston.transports.Console()];
if (!process.env.VERCEL) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports,
});

module.exports = logger;
