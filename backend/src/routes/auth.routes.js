const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authJwt');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.post(
  '/register',
  authLimiter,
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 8 })],
  validate,
  register
);

router.post('/login', authLimiter, [body('email').isEmail(), body('password').notEmpty()], validate, login);

router.get('/me', protect, me);

module.exports = router;
