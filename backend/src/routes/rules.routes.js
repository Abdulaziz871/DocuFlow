const router = require('express').Router();
const { protect } = require('../middleware/authJwt');
const { allowRoles } = require('../middleware/roleCheck');
const { createRule, listRules, updateRule, deleteRule } = require('../controllers/rules.controller');

router.use(protect, allowRoles('system_admin', 'operations_manager'));
router.post('/', createRule);
router.get('/', listRules);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

module.exports = router;
