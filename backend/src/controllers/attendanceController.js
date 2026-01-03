const Attendance = require('../models/Attendance');

// Helper to normalize date to midnight UTC
const normalizeDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

// @desc    Clock In (Manual)
// @route   POST /api/attendance/clock-in
// @access  Private (Employee)
const clockIn = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Employee profile not linked' });
        }

        const today = normalizeDate();

        // Check if already clocked in
        const existingAttendance = await Attendance.findOne({
            employee: employeeId,
            date: today,
        });

        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'Attendance record already exists for today' });
        }

        const attendance = await Attendance.create({
            employee: employeeId,
            date: today,
            clockIn: new Date(),
            status: 'PRESENT',
            source: 'MANUAL',
        });

        res.status(201).json({ success: true, message: 'Clocked in successfully', data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Clock Out (Manual)
// @route   POST /api/attendance/clock-out
// @access  Private (Employee)
const clockOut = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        const today = normalizeDate();

        const attendance = await Attendance.findOne({
            employee: employeeId,
            date: today,
        });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No attendance record found for today. Please clock in first.' });
        }

        if (attendance.clockOut) {
            return res.status(400).json({ success: false, message: 'Already clocked out for today' });
        }

        attendance.clockOut = new Date();

        // Calculate duration in minutes
        const diffMs = attendance.clockOut - attendance.clockIn;
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000) + Math.floor(diffMs / 3600000) * 60; // Simple diff
        attendance.workDuration = Math.floor(diffMs / 1000 / 60);

        await attendance.save();

        res.json({ success: true, message: 'Clocked out successfully', data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get My Attendance History
// @route   GET /api/attendance/me
// @access  Private (Employee)
const getMyAttendance = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;

        // Optional filters: month, year (default current)
        // For simplified MVP, just return last 30 records
        const attendance = await Attendance.find({ employee: employeeId })
            .sort({ date: -1 })
            .limit(30);

        res.json({ success: true, count: attendance.length, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    clockIn,
    clockOut,
    getMyAttendance,
};
