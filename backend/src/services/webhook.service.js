const axios = require('axios');
const WebhookLog = require('../models/WebhookLog');
const { webhookTimeoutMs } = require('../config/env');
const logger = require('../utils/logger');

/**
 * Notifies the company's configured webhook URL that a document finished processing.
 * Failures are logged (WebhookLog) but never thrown - a broken customer webhook
 * must not fail the document processing pipeline itself.
 */
async function notifyWebhook({ company, document }) {
  if (!company.webhookUrl) return { skipped: true };

  const payload = {
    event: document.status === 'failed' ? 'document.failed' : 'document.processed',
    documentId: document._id,
    fileName: document.originalFileName,
    status: document.status,
    documentType: document.documentType,
    extractedData: document.extractedData,
    matchedRules: document.matchedRules.map((m) => m.rule),
    errorMessage: document.errorMessage || undefined,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await axios.post(company.webhookUrl, payload, { timeout: webhookTimeoutMs });
    await WebhookLog.create({
      company: company._id,
      document: document._id,
      url: company.webhookUrl,
      statusCode: response.status,
      success: true,
      responseSnippet: JSON.stringify(response.data).slice(0, 300),
    });
    return { success: true };
  } catch (err) {
    logger.warn(`Webhook delivery failed for company ${company._id}: ${err.message}`);
    await WebhookLog.create({
      company: company._id,
      document: document._id,
      url: company.webhookUrl,
      statusCode: err.response?.status || null,
      success: false,
      responseSnippet: err.message.slice(0, 300),
    });
    return { success: false };
  }
}

module.exports = { notifyWebhook };
