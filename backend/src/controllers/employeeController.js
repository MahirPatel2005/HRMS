const User = require('../models/User');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const Department = require('../models/Department');
const { generateLoginId, generateTempPassword } = require('../utils/generators');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Onboard a new employee (Admin/HR only)
// @route   POST /api/employees
// @access  Private (Admin/HR)
const onboardEmployee = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        phone,
        department,
        designation,
        joiningDate,
        dob,
        address,
    } = req.body;

    try {
        // 1. Check if user with email already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // 2. Validate Department
        if (department) {
            const deptParams = await Department.findById(department);
            if (!deptParams) {
                return res.status(400).json({ success: false, message: 'Invalid Department ID' });
            }
            if (deptParams.company.toString() !== req.user.company.toString()) {
                return res.status(403).json({ success: false, message: 'Department belongs to another company' });
            }
            if (!deptParams.isActive) {
                return res.status(400).json({ success: false, message: 'Cannot onboard to an INACTIVE department' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }

        // 3. Format Data
        const formattedJoiningDate = joiningDate ? new Date(joiningDate) : new Date();

        // 3. Generate Login Credentials
        // Need company details and serial number
        const company = await Company.findById(req.user.company);
        const employeeCount = await Employee.countDocuments({ company: req.user.company });

        // Serial number is current count + 1 (plus whatever offset, e.g. 1)
        // Using count + 1 is simple but can have race conditions in high concurrency. 
        // unique index on LoginID would prevent duplicates, but let's stick to simple logic for now.
        const loginId = generateLoginId(company, firstName, lastName, formattedJoiningDate, employeeCount + 1);
        const tempPassword = generateTempPassword();

        const crypto = require('crypto'); // Add crypto for token

        // ... (inside function) 
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // 4. Create User Account
        const user = await User.create({
            email,
            loginId,
            password: tempPassword,
            role: 'EMPLOYEE',
            company: req.user.company,
            isVerified: false, // Strict: Admin-created users must verify email
            verificationToken,
            isFirstLogin: true,
        });

        // 5. Create Employee Profile
        const employee = await Employee.create({
            firstName,
            lastName,
            user: user._id,
            company: req.user.company,
            department,
            designation,
            joiningDate: formattedJoiningDate,
            phone,
            dob,
            address,
            status: 'ACTIVE',
        });

        // 6. Link Employee to User
        user.employeeId = employee._id;
        await user.save();

        // 7. Send Welcome Email
        // Mocking the verification link
        const verifyLink = `http://localhost:5001/api/auth/verify-email?token=${verificationToken}`;
        await sendWelcomeEmail(email, loginId, tempPassword, verifyLink); // Need to update emailService too

        console.log('DEBUG: Sending response with:', { loginId, tempPassword, verifyLink }); // <--- DEBUG LOG

        res.status(201).json({
            success: true,
            message: 'Employee onboarded successfully. Please verify email.',
            data: {
                employee,
                loginId,
                tempPassword,
            },
        });
    } catch (error) {
        console.error('Error onboarding employee:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    List all employees
// @route   GET /api/employees
// @access  Private (Admin/HR)
const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ company: req.user.company })
            .populate('department', 'name')
            .populate('user', 'email role isVerified');

        res.json({ success: true, count: employees.length, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
// @access  Private (Admin/HR)
const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Ensure admin belongs to same company
        if (employee.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this employee' });
        }

        // Update fields
        const {
            firstName, lastName, department, designation, phone, dob, address,
        } = req.body;

        employee.firstName = firstName || employee.firstName;
        employee.lastName = lastName || employee.lastName;
        employee.department = department || employee.department;
        employee.designation = designation || employee.designation;
        employee.phone = phone || employee.phone;
        employee.dob = dob || employee.dob;
        employee.address = address || employee.address;

        await employee.save();

        res.json({ success: true, message: 'Employee updated successfully', data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update employee status (Deactivate/Activate)
// @route   PATCH /api/employees/:id/status
// @access  Private (Admin/HR)
const updateEmployeeStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (employee.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        employee.status = status;
        await employee.save();

        res.json({ success: true, message: `Employee status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current employee profile
// @route   GET /api/employees/me
// @access  Private (Employee)
const getMe = async (req, res) => {
    try {
        if (!req.user.employeeId) {
            return res.status(404).json({ success: false, message: 'Employee profile not linked' });
        }

        const employee = await Employee.findById(req.user.employeeId)
            .populate('department', 'name')
            .populate('company', 'name');

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found' });
        }

        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update current employee profile
// @route   PUT /api/employees/me
// @access  Private (Employee)
const updateMe = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user.employeeId);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found' });
        }

        // Employees can only update limited fields
        const { phone, address, dob } = req.body;

        employee.phone = phone || employee.phone;
        employee.address = address || employee.address;
        employee.dob = dob || employee.dob;

        await employee.save();

        res.json({ success: true, message: 'Profile updated successfully', data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete employee (Deactivate)
// @route   DELETE /api/employees/:id
// @access  Private (Admin/HR)
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (employee.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        employee.status = 'INACTIVE';
        await employee.save();

        res.json({ success: true, message: 'Employee deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private (Admin/HR)
const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('department', 'name')
            .populate('user', 'email role isVerified');

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (employee.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    onboardEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee,
    getMe,
    updateMe,
};
