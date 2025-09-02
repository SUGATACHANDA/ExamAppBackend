// controllers/resultController.js
const asyncHandler = require('express-async-handler');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

// @desc    Submit an exam
// @route   POST /api/results/submit
// @access  Private/Student
const submitExam = asyncHandler(async (req, res) => {
    const { examId, answers } = req.body;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Check if already submitted
    const existingResult = await Result.findOne({ exam: examId, student: studentId });
    if (existingResult) {
        res.status(400);
        throw new Error("You have already submitted this exam.");
    }

    let score = 0;
    const totalMarks = exam.questions.length;

    exam.questions.forEach(question => {
        const studentAnswer = answers.find(ans => ans.questionId === question._id.toString());
        if (studentAnswer && studentAnswer.submittedAnswer === question.correctAnswer) {
            score++;
        }
    });

    const result = await Result.create({
        exam: examId,
        student: studentId,
        score,
        totalMarks,
        answers,
        status: 'completed',
    });

    res.status(201).json(result);
});

// @desc    Get results for a specific exam (for teacher)
// @route   GET /api/results/exam/:examId
// @access  Private/Teacher
const getResultsForExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    // Ensure the teacher requesting the results is the one who created the exam
    if (!exam || exam.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to view results for this exam.");
    }

    const results = await Result.find({ exam: req.params.examId })
        .populate('student', 'name collegeId');
    res.json(results);
});


// @desc    Update proctoring log for a result
// @route   POST /api/results/proctoring-log
// @access  Private/Student (The student's own app sends this)
const addProctoringLog = asyncHandler(async (req, res) => {
    const { examId, event } = req.body;
    const studentId = req.user._id;

    // Find or create a result entry for the ongoing exam
    let result = await Result.findOne({ exam: examId, student: studentId });
    if (!result) {
        // Create an 'ongoing' entry if one doesn't exist
        result = await Result.create({
            exam: examId,
            student: studentId,
            score: 0,
            totalMarks: 0, // Will be updated on submission
            answers: [],
            status: 'ongoing',
        });
    }

    result.proctoringLog.push({ event });
    await result.save();

    // In a real app, this would also emit a WebSocket event to the teacher's dashboard
    req.app.get('io').to(`exam_proctor_${examId}`).emit('proctoring_event', {
        studentId,
        studentName: req.user.name,
        event
    });

    res.status(200).json({ message: 'Log added' });
});


module.exports = { submitExam, getResultsForExam, addProctoringLog };