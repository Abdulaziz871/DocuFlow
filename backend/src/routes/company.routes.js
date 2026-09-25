const router = require('express').Router();
const { protect } = require('../middleware/authJwt');
const { allowRoles } = require('../middleware/roleCheck');
const { getCompany, updateCompany, sendTestWebhook, sendTestEmail, listWebhookLogs } = require('../controllers/company.controller');

router.use(protect, allowRoles('system_admin', 'operations_manager'));
router.get('/', getCompany);
router.patch('/', updateCompany);
router.post('/webhook-test', sendTestWebhook);
router.post('/email-test', sendTestEmail);
router.get('/webhook-logs', listWebhookLogs);

module.exports = router;
