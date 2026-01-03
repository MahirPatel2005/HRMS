const express = require('express');
const { clockIn, clockOut, getMyAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/me', getMyAttendance);

module.exports = router;
