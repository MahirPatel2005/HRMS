const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Admin/HR)
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ company: req.user.company });
        res.json({ success: true, count: departments.length, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDepartments,
};
