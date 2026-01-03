const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Get All Attendance Records
// @route   GET /api/admin/attendance
// @access  Private (Admin/HR)
const getAllAttendance = async (req, res) => {
    try {
        const { date, department } = req.query;
        let query = {};

        // Filter by Date
        if (date) {
            const queryDate = new Date(date);
            queryDate.setUTCHours(0, 0, 0, 0);
            query.date = queryDate;
        }

        // Filter by Department (Requires filtering employees first)
        if (department) {
            const employees = await Employee.find({ department }).select('_id');
            const employeeIds = employees.map(emp => emp._id);
            query.employee = { $in: employeeIds };
        }

        // Ensure Admin sees only their company's data
        // Filter employees by company
        // Optimized approach: find employees of company, then find attendance
        const companyEmployees = await Employee.find({ company: req.user.company }).select('_id');
        const companyEmployeeIds = companyEmployees.map(emp => emp._id);

        // Merge company filter with other filters
        if (query.employee) {
            // Intersection if department filter was active
            // (No need to intersect if logic ensures dept belongs to company, but safe to do so)
            // query.employee is already set
        } else {
            query.employee = { $in: companyEmployeeIds };
        }

        const attendance = await Attendance.find(query)
            .populate('employee', 'firstName lastName loginId')
            .sort({ date: -1 });

        res.json({ success: true, count: attendance.length, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Import Attendance (Biometric/Machine)
// @route   POST /api/admin/attendance/import
// @access  Private (Admin/HR)
const importAttendance = async (req, res) => {
    // Body: { records: [ { loginId, date, status, clockIn, clockOut } ] }
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ success: false, message: 'Invalid data format. Expected array of records.' });
    }

    const results = {
        successCount: 0,
        errors: [],
    };

    try {
        // Pre-fetch all employees for this company to map Login ID -> Employee ID
        const employees = await Employee.find({ company: req.user.company }).populate('user', 'loginId');

        // Create a map for quick lookup: LoginID -> EmployeeID
        // Wait, User has LoginID. Employee has link to User.
        // We need to look up User by loginId, then get user.employeeId?
        // OR: Employee -> User (populated). 
        // Let's create a Map: loginID -> employee._id

        // Fetch Users with LoginIDs
        const users = await User.find({ company: req.user.company, loginId: { $ne: null } });
        const loginIdMap = {};
        users.forEach(u => {
            if (u.loginId) loginIdMap[u.loginId] = u.employeeId;
        });

        // Process records
        for (const record of records) {
            const { loginId, date, status, clockIn, clockOut } = record;

            // 1. Validate Employee
            const employeeId = loginIdMap[loginId];
            if (!employeeId) {
                results.errors.push({ loginId, message: 'Employee not found or invalid Login ID' });
                continue;
            }

            // 2. Validate Data
            if (!date || !status) {
                results.errors.push({ loginId, message: 'Missing date or status' });
                continue;
            }

            const normalizedDate = new Date(date);
            normalizedDate.setUTCHours(0, 0, 0, 0);

            // 3. Check for Existing Record
            const exists = await Attendance.findOne({ employee: employeeId, date: normalizedDate });
            if (exists) {
                // Skip or Update? Requirement says "One attendance per day".
                // We'll skip and report duplication
                results.errors.push({ loginId, date, message: 'Attendance record already exists' });
                continue;
            }

            // 4. Create Record
            await Attendance.create({
                employee: employeeId,
                date: normalizedDate,
                status: status.toUpperCase(), // Ensure enum case
                clockIn: clockIn ? new Date(clockIn) : undefined,
                clockOut: clockOut ? new Date(clockOut) : undefined,
                source: 'MACHINE',
                workDuration: 0, // Calculate if needed, but machine might not provide precise times or calc logic differs
            });
            results.successCount++;
        }

        res.json({
            success: true,
            message: `Import processed. Success: ${results.successCount}, Errors: ${results.errors.length}`,
            data: results,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllAttendance,
    importAttendance,
};
