// models/Result.js
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    totalMarks: {
        type: Number,
        required: true,
    },
    // Storing the answers for review
    answers: [{
        questionId: mongoose.Schema.Types.ObjectId,
        submittedAnswer: String,
    }],
    // For proctoring flags
    proctoringLog: [{
        event: String, // e.g., 'TAB_SWITCH', 'COPY_PASTE_ATTEMPT'
        timestamp: { type: Date, default: Date.now },
    }],
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'expelled'],
        default: 'ongoing',
    },
}, {
    timestamps: true,
});

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;