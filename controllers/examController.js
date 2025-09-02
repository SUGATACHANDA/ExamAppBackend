// backend/controllers/examController.js
const asyncHandler = require('express-async-handler');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Teacher
const createExam = asyncHandler(async (req, res) => {
    const { title, questionIds, scheduledAt, duration, examType } = req.body;

    // Use the UTC-converted date from the frontend
    const scheduledAtUTC = new Date(scheduledAt);

    const questions = await Question.find({
        '_id': { $in: questionIds },
        'subject': req.user.subject
    });

    if (questions.length !== questionIds.length) {
        res.status(400);
        throw new Error('Some question IDs are invalid or do not belong to your subject');
    }

    const exam = new Exam({
        title,
        subject: req.user.subject,
        questions: questionIds,
        createdBy: req.user._id,
        scheduledAt: scheduledAtUTC, // Store the UTC date object
        duration,
        examType
    });

    const createdExam = await exam.save();
    res.status(201).json(createdExam);
});

// @desc    Get exams created by a teacher
// @route   GET /api/exams
// @access  Private/Teacher
const getMyExams = asyncHandler(async (req, res) => {
    const exams = await Exam.find({ createdBy: req.user._id });
    res.json(exams);
});

// @desc    Get exam details for a student to start, with strict time validation
// @route   GET /api/exams/start/:id
// @access  Private/Student
const getExamForStudent = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).populate('questions', '-correctAnswer');

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const now = new Date();
    const scheduledTime = new Date(exam.scheduledAt);
    const windowStartTime = new Date(scheduledTime.getTime() - exam.loginWindowStart * 60000);
    const windowEndTime = new Date(scheduledTime.getTime() + exam.lateEntryWindowEnd * 60000);

    if (now < windowStartTime) {
        res.status(403);
        throw new Error(`The login window has not opened yet. Please try again after ${windowStartTime.toLocaleTimeString()}`);
    }

    if (now > windowEndTime) {
        res.status(403);
        throw new Error(`The login window for this exam has closed. Entry was allowed until ${windowEndTime.toLocaleTimeString()}`);
    }

    res.json(exam);
});

// @desc    Get all exams for a student to view
// @route   GET /api/exams/student/all
// @access  Private/Student
const getAvailableExamsForStudent = asyncHandler(async (req, res) => {
    // This is the critical function. We find all exams where the entry window
    // has NOT yet closed.
    const now = new Date();

    // Use a direct MongoDB query which is much more efficient than filtering in JS.
    // We are looking for exams where the end of the late entry window is in the future.
    // Mongoose can't directly query based on a calculated value, so we have to filter after fetching.
    // The previous implementation was correct, but let's re-verify it.

    // Let's fetch all exams and filter in the application logic. This is easier to debug.
    const allExams = await Exam.find({}).sort({ scheduledAt: 'asc' });

    if (!allExams) {
        return res.json([]);
    }

    const availableExams = allExams.filter(exam => {
        const scheduledTime = new Date(exam.scheduledAt);
        // The time when a student can no longer enter the exam.
        const entryDeadline = new Date(scheduledTime.getTime() + (exam.lateEntryWindowEnd * 60000));
        // If the current time is before the deadline, the exam is available.
        return now < entryDeadline;
    });

    res.json(availableExams);
});

// ----- CORRECTED EXPORTS -----
// This is the clean, standard way to export all functions from a controller.
module.exports = {
    createExam,
    getMyExams,
    getExamForStudent,
    getAvailableExamsForStudent,
};