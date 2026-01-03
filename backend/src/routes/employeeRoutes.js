const express = require('express');
const {
    onboardEmployee, getEmployees, getEmployeeById, updateEmployee, updateEmployeeStatus, deleteEmployee, getMe, updateMe,
} = require('../controllers/employeeController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');
const { firstLoginGuard } = require('../middlewares/firstLoginGuard');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(firstLoginGuard);

// Admin/HR Routes
router.route('/')
    .post(authorize('ADMIN', 'HR'), onboardEmployee)
    .get(authorize('ADMIN', 'HR'), getEmployees);

// Employee Self-Service (Must be before /:id routes)
router.get('/me', getMe);
router.put('/me', updateMe);

router.route('/:id')
    .get(authorize('ADMIN', 'HR'), getEmployeeById)
    .put(authorize('ADMIN', 'HR'), updateEmployee)
    .delete(authorize('ADMIN', 'HR'), deleteEmployee);

router.route('/:id/status')
    .patch(authorize('ADMIN', 'HR'), updateEmployeeStatus);

module.exports = router;
