const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey, geminiModel } = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(geminiApiKey);

// Strict prompt: force Gemini to return ONLY a JSON object, no markdown fences, no commentary.
const buildPrompt = (rawText) => `
You are a document data-extraction engine. Read the raw text below (extracted via OCR from an
invoice, receipt, contract, or similar business document) and return a SINGLE JSON object only.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanations, no leading/trailing text.
- If a field is not present in the text, set its value to null.
- Detect and include "documentType" (e.g. "invoice", "receipt", "contract", "purchase_order", "other").
- Use this JSON shape:
{
  "documentType": string,
  "vendorName": string | null,
  "documentNumber": string | null,
  "issueDate": string | null,
  "dueDate": string | null,
  "currency": string | null,
  "totalAmount": number | null,
  "taxAmount": number | null,
  "lineItems": [ { "description": string, "quantity": number | null, "unitPrice": number | null, "total": number | null } ],
  "customFields": object
}

Raw document text:
"""
${rawText}
"""
`;

const RETRYABLE_STATUS = [429, 500, 503, 504];
const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini occasionally returns transient 429/503 ("high demand") errors that succeed
// moments later — retry a few times with backoff before giving up on the whole document.
async function generateWithRetry(model, prompt) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      lastErr = err;
      const isRetryable = RETRYABLE_STATUS.some((code) => err.message?.includes(String(code)));
      if (!isRetryable || attempt === MAX_ATTEMPTS) break;
      const delayMs = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s
      logger.warn(`Gemini call failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delayMs}ms: ${err.message}`);
      await sleep(delayMs);
    }
  }
  throw lastErr;
}

async function extractStructuredData(rawText) {
  const model = genAI.getGenerativeModel({ model: geminiModel });

  let result;
  try {
    result = await generateWithRetry(model, buildPrompt(rawText));
  } catch (err) {
    logger.error(`Gemini API call failed after retries: ${err.message}`);
    throw new ApiError(502, 'AI extraction service unavailable. Please try again shortly.');
  }

  const responseText = result.response.text().trim();
  const cleaned = responseText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error(`Gemini returned non-JSON payload: ${cleaned.slice(0, 300)}`);
    throw new ApiError(502, 'AI extraction returned an invalid format.');
  }
}

module.exports = { extractStructuredData };
