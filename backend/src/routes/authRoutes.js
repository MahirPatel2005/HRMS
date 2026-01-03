const express = require('express');
const { loginUser, changePassword, verifyEmail } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);
router.get('/verify-email', verifyEmail);

module.exports = router;
