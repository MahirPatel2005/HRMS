const express = require('express');
const { applyLeave, getMyLeaves } = require('../controllers/leaveController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/apply', applyLeave);
router.get('/me', getMyLeaves);

module.exports = router;
