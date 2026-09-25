const router = require('express').Router();
const { protect } = require('../middleware/authJwt');
const { overview } = require('../controllers/dashboard.controller');

router.get('/overview', protect, overview);

module.exports = router;
