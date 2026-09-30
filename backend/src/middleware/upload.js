const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { uploadDir: configuredUploadDir, maxFileSizeMb } = require('../config/env');
const ApiError = require('../utils/ApiError');

// Vercel's deployment filesystem is read-only outside of os.tmpdir() (/tmp),
// so the configured relative "uploads" dir can't be created there.
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : configuredUploadDir;

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  // busboy (multer's parser) decodes the multipart Content-Disposition filename as latin1,
  // so any non-ASCII name (Arabic, etc.) arrives mojibake'd — re-decode it as UTF-8 here,
  // before it's used for the extension (storage.filename) or saved as originalFileName.
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Only PDF and images are allowed.`));
  }
  cb(null, true);
}

// Vercel rejects request bodies over 4.5 MB before they reach Express; 4 MB leaves room for multipart overhead.
const effectiveMaxMb = process.env.VERCEL ? Math.min(maxFileSizeMb, 4) : maxFileSizeMb;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: effectiveMaxMb * 1024 * 1024 },
});

module.exports = upload;
