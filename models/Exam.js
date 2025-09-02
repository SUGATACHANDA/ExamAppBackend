// models/Exam.js
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    scheduledAt: {
        type: Date,
        required: true,
    },
    // Duration in minutes
    duration: {
        type: Number,
        required: function () { return this.examType === 'timed'; },
    },
    examType: {
        type: String,
        enum: ['timed', 'untimed'],
        default: 'untimed',
    },
    // The login window before the scheduled time (in minutes)
    loginWindowStart: {
        type: Number,
        default: 10,
    },
    // The late entry window after the scheduled time (in minutes)
    lateEntryWindowEnd: {
        type: Number,
        default: 5,
    }
}, {
    timestamps: true,
});

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;