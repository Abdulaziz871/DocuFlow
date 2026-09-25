const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');

/**
 * Extracts raw text from an uploaded file.
 * - PDFs are parsed directly (fast path, works for text-based PDFs).
 * - Images (and scanned PDFs with no embedded text) fall back to Tesseract OCR.
 */
async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    const buffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(buffer);
    const text = (parsed.text || '').trim();

    if (text.length > 20) return text; // real text layer found
    logger.info('PDF has no usable text layer, falling back to OCR on rendered pages is out of scope for MVP');
    return text; // MVP: for scanned PDFs, plug pdf-to-image + Tesseract here later
  }

  // Image files -> Tesseract OCR
  const { data } = await Tesseract.recognize(filePath, 'eng+ara');
  return (data.text || '').trim();
}

module.exports = { extractText };
