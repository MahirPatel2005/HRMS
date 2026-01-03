const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    // Determine if input is email or loginId
    const { email, loginId, password, tempPassword } = req.body;

    // Support "tempPassword" field from manual copy-paste
    const passwordToUse = password || tempPassword;

    if (!passwordToUse) {
        return res.status(400).json({ success: false, message: 'Please provide a password' });
    }

    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (loginId) {
            user = await User.findOne({ loginId });
        } else {
            return res.status(400).json({ success: false, message: 'Please provide email or Login ID' });
        }

        if (user && (await user.matchPassword(passwordToUse))) {
            // Check if user is verified (only for email-based login if needed, but apply globally)
            // But active employees are auto-verified
            if (!user.isVerified) {
                return res.status(401).json({ success: false, message: 'Please verify your email to login' });
            }

            res.json({
                success: true,
                data: {
                    _id: user._id,
                    email: user.email,
                    loginId: user.loginId,
                    role: user.role,
                    isFirstLogin: user.isFirstLogin, // Frontend can redirect if true
                    token: generateToken(user._id),
                },
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword; // Will be hashed by pre-save hook
            user.isFirstLogin = false; // Mark as no longer first login
            await user.save();
            res.json({ success: true, message: 'Password updated successfully' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify email (Stub)
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    // Logic for email verification would go here (e.g. checking token against DB)
    res.json({ success: true, message: 'Email verified successfully' });
};

module.exports = {
    loginUser,
    changePassword,
    verifyEmail,
};
