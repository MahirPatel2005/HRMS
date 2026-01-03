const express = require('express');
const { getDepartments } = require('../controllers/departmentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'HR'), getDepartments);

module.exports = router;
