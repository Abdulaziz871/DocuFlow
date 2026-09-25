const router = require('express').Router();
const { protect } = require('../middleware/authJwt');
const { allowRoles } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const {
  uploadDocument,
  listDocuments,
  getDocument,
  reviewDocument,
} = require('../controllers/documents.controller');

// Dashboard document routes (JWT-authenticated). Both admin and ops manager can upload/view;
// only ops manager / admin can approve reviewed documents.
router.post('/upload', protect, allowRoles('system_admin', 'operations_manager'), upload.single('file'), uploadDocument);
router.get('/', protect, listDocuments);
router.get('/:id', protect, getDocument);
router.patch('/:id/review', protect, allowRoles('system_admin', 'operations_manager'), reviewDocument);

module.exports = router;
