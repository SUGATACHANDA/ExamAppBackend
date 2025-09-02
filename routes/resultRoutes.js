// routes/resultRoutes.js
const express = require('express');
const router = express.Router();
const { submitExam, getResultsForExam, addProctoringLog } = require('../controllers/resultController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/submit', protect, authorize('student'), submitExam);
router.get('/exam/:examId', protect, authorize('teacher'), getResultsForExam);
router.post('/proctoring-log', protect, authorize('student'), addProctoringLog);

module.exports = router;