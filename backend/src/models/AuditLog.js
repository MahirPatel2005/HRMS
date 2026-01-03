const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            // e.g. 'EMPLOYEE_CREATED', 'LEAVE_APPROVED'
        },
        entity: {
            type: String,
            enum: ['EMPLOYEE', 'LEAVE', 'ATTENDANCE', 'PAYROLL', 'AUTH', 'DOCUMENT'],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            // Generic reference, not hard linked to one collection via 'ref' usually
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        metadata: {
            type: Object, // Flexible JSON for details
        },
    },
    { timestamps: true } // createdAt serves as timestamp
);

// Immutable logs? Mongoose doesn't strictly enforce immutable collections easily without plugins,
// but we can enforce it at Controller level (no delete/update APIs).

module.exports = mongoose.model('AuditLog', auditLogSchema);
