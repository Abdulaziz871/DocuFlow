const router = require('express').Router();
const { protect } = require('../middleware/authJwt');
const { allowRoles } = require('../middleware/roleCheck');
const { listUsers, updateUserRole, deactivateUser } = require('../controllers/users.controller');

router.use(protect, allowRoles('system_admin'));
router.get('/', listUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/deactivate', deactivateUser);

module.exports = router;
