const router = require('express').Router();
const { protect } = require('../middleware/authJwt');
const { allowRoles } = require('../middleware/roleCheck');
const { createApiKey, listApiKeys, revokeApiKey } = require('../controllers/apiKeys.controller');

router.use(protect, allowRoles('system_admin', 'operations_manager'));
router.post('/', createApiKey);
router.get('/', listApiKeys);
router.delete('/:id', revokeApiKey);

module.exports = router;
