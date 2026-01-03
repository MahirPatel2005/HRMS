const express = require('express');
const {
    onboardEmployee, getEmployees, updateEmployee, updateEmployeeStatus, getMe, updateMe,
} = require('../controllers/employeeController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin/HR Routes
router.route('/')
    .post(authorize('ADMIN', 'HR'), onboardEmployee)
    .get(authorize('ADMIN', 'HR'), getEmployees);

// Employee Self-Service (Must be before /:id routes)
router.get('/me', getMe);
router.put('/me', updateMe);

router.route('/:id')
    .put(authorize('ADMIN', 'HR'), updateEmployee);

router.route('/:id/status')
    .patch(authorize('ADMIN', 'HR'), updateEmployeeStatus);

module.exports = router;
