// routes/examRoutes.js
const express = require('express');
const router = express.Router();
const { createExam, getMyExams, getExamForStudent, getAvailableExamsForStudent } = require('../controllers/examController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, authorize('teacher'), createExam)
    .get(protect, authorize('teacher'), getMyExams);

router.get('/student/all', protect, authorize('student'), getAvailableExamsForStudent);
router.get('/start/:id', protect, authorize('student'), getExamForStudent);

module.exports = router;