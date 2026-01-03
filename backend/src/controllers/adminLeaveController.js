const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

// @desc    Get All Leaves (Admin)
// @route   GET /api/admin/leaves
// @access  Private (Admin/HR)
const getAllLeaves = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        // Filter by company
        query.company = req.user.company;

        if (status) {
            query.status = status;
        }

        const leaves = await Leave.find(query)
            .populate('employee', 'firstName lastName loginId designation department')
            .sort({ fromDate: -1 });

        res.json({ success: true, count: leaves.length, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Take Action on Leave (Approve/Reject)
// @route   PATCH /api/admin/leaves/:id/action
// @access  Private (Admin/HR)
const takeLeaveAction = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const leaveId = req.params.id;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use APPROVED or REJECTED' });
        }

        const leave = await Leave.findById(leaveId);

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        if (leave.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `Leave is already ${leave.status}` });
        }

        // Update Leave Status
        leave.status = status;
        leave.actionBy = req.user._id;
        leave.remarks = remarks || leave.remarks;
        await leave.save();

        let syncInfo = { created: 0, skipped: 0 };

        // --- ATTENDANCE SYNC LOGIC ---
        if (status === 'APPROVED') {
            // Loop dates
            let currentDate = new Date(leave.fromDate);
            const endDate = new Date(leave.toDate);

            while (currentDate <= endDate) {
                // Normalize date
                const normalizedDate = new Date(currentDate);
                normalizedDate.setUTCHours(0, 0, 0, 0);

                // Check existence
                const exists = await Attendance.findOne({
                    employee: leave.employee,
                    date: normalizedDate,
                });

                if (!exists) {
                    await Attendance.create({
                        employee: leave.employee,
                        date: normalizedDate,
                        status: 'ON_LEAVE',
                        source: 'MANUAL', // System generated, but marked manual for now or add SYSTEM enum later
                        remarks: `Leave Applied: ${leave.type}`,
                    });
                    syncInfo.created++;
                } else {
                    syncInfo.skipped++;
                }

                // Next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        res.json({
            success: true,
            message: `Leave ${status}`,
            data: leave,
            sync: status === 'APPROVED' ? syncInfo : undefined,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllLeaves,
    takeLeaveAction,
};
