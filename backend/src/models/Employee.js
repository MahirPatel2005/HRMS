const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        // Personal Details
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        dob: {
            type: Date,
        },
        address: {
            type: String,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true,
        },
        designation: {
            type: String,
            required: true,
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'],
            default: 'ACTIVE',
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Employee', employeeSchema);
