const router = require('express').Router();
const { protectApiKey } = require('../middleware/authApiKey');
const { ingestionLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const { ingestDocument } = require('../controllers/documents.controller');

// External ingestion endpoint — used by outside systems / developers via API key (step 1 of workflow).
router.post('/', protectApiKey, ingestionLimiter, upload.single('file'), ingestDocument);

module.exports = router;
