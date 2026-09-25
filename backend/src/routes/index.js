const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/documents', require('./documents.routes'));
router.use('/ingest', require('./ingest.routes'));
router.use('/rules', require('./rules.routes'));
router.use('/api-keys', require('./apiKeys.routes'));
router.use('/users', require('./users.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/company', require('./company.routes'));

module.exports = router;
