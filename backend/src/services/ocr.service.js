const fs = require('fs');
const os = require('os');
const { extractText: extractPdfText, getDocumentProxy } = require('unpdf');
const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');

const MIN_TEXT_LENGTH = 20;

/**
 * Extracts raw text from an uploaded file.
 * - PDFs are parsed directly (fast path, works for text-based PDFs).
 * - Images fall back to Tesseract OCR.
 * Returns an empty string when no usable text is found (e.g. scanned PDFs),
 * so the caller can hand the original file to Gemini instead.
 */
async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    let text;
    try {
      const pdf = await getDocumentProxy(new Uint8Array(fs.readFileSync(filePath)));
      ({ text } = await extractPdfText(pdf, { mergePages: true }));
    } catch (err) {
      logger.warn(`PDF text extraction failed, falling back to Gemini vision: ${err.message}`);
      return '';
    }
    const trimmed = (text || '').trim();
    if (trimmed.length < MIN_TEXT_LENGTH) {
      logger.info('PDF has no usable text layer; falling back to Gemini vision');
      return '';
    }
    return trimmed;
  }

  // Tesseract hangs on Vercel (worker thread + CDN language download); Gemini reads the image directly instead.
  if (process.env.VERCEL) return '';

  try {
    // Tesseract caches downloaded language data in the cwd by default, which is read-only on Vercel.
    const { data } = await Tesseract.recognize(filePath, 'eng+ara', { cachePath: os.tmpdir() });
    const trimmed = (data.text || '').trim();
    return trimmed.length < MIN_TEXT_LENGTH ? '' : trimmed;
  } catch (err) {
    logger.warn(`Tesseract OCR failed, falling back to Gemini vision: ${err.message}`);
    return '';
  }
}

module.exports = { extractText };
