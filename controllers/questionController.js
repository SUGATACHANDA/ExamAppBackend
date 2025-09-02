// controllers/questionController.js
const asyncHandler = require('express-async-handler');
const Question = require('../models/Question');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Teacher
const createQuestion = asyncHandler(async (req, res) => {
    const { questionText, options, correctAnswer } = req.body;

    // The teacher's subject is attached to their profile/token
    const subject = req.user.subject;

    if (!questionText || !options || !correctAnswer) {
        res.status(400);
        throw new Error('Please fill all fields');
    }

    const question = new Question({
        questionText,
        options,
        correctAnswer,
        subject,
        createdBy: req.user._id,
    });

    const createdQuestion = await question.save();
    res.status(201).json(createdQuestion);
});

// @desc    Get questions for the logged-in teacher
// @route   GET /api/questions
// @access  Private/Teacher
const getMyQuestions = asyncHandler(async (req, res) => {
    // A teacher can only see questions of their own subject
    const questions = await Question.find({ createdBy: req.user._id, subject: req.user.subject });
    res.json(questions);
});

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private/Teacher
const updateQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);

    if (!question) {
        res.status(404);
        throw new Error('Question not found');
    }

    // Ensure the teacher updating the question is the one who created it
    if (question.createdBy.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to update this question');
    }

    const { questionText, options, correctAnswer } = req.body;

    question.questionText = questionText || question.questionText;
    question.options = options || question.options;
    question.correctAnswer = correctAnswer || question.correctAnswer;

    const updatedQuestion = await question.save();
    res.json(updatedQuestion);
});

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private/Teacher
const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);

    if (!question) {
        res.status(404);
        throw new Error('Question not found');
    }

    if (question.createdBy.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await question.deleteOne(); // Use deleteOne()
    res.json({ message: 'Question removed' });
});

module.exports = { createQuestion, getMyQuestions, updateQuestion, deleteQuestion };