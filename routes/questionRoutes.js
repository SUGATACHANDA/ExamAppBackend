// routes/questionRoutes.js
const express = require('express');
const router = express.Router();
const { createQuestion, getMyQuestions, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, authorize('teacher'), createQuestion)
    .get(protect, authorize('teacher'), getMyQuestions);

router.route('/:id')
    .put(protect, authorize('teacher'), updateQuestion)
    .delete(protect, authorize('teacher'), deleteQuestion);

module.exports = router;