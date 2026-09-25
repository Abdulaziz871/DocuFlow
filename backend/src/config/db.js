const mongoose = require('mongoose');
const { mongoUri, env } = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongoUri);
    logger.info(`MongoDB connected (${env}) -> ${mongoose.connection.name}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

module.exports = connectDB;
