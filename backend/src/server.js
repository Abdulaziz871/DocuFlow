const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config/env');
const logger = require('./utils/logger');

(async () => {
  await connectDB();

  const server = app.listen(port, () => {
    logger.info(`DocuFlow AI backend running on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
})();
