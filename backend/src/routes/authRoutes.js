const express = require('express');
const { loginUser, changePassword, verifyEmail } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, loginUser);
router.post('/change-password', protect, changePassword);
router.get('/verify-email', verifyEmail);

module.exports = router;
