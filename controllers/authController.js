// controllers/authController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (should be Admin in a real app)
const registerUser = asyncHandler(async (req, res) => {
    // When role is 'student', `subject` will be undefined in the body, which is correct.
    const { collegeId, name, password, role, subject } = req.body;

    const userExists = await User.findOne({ collegeId });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({ collegeId, name, password, role, subject });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            collegeId: user.collegeId,
            role: user.role,
            subject: user.subject, // Will be undefined for students
            token: generateToken(user._id, user.role, user.subject),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { collegeId, password } = req.body;

    const user = await User.findOne({ collegeId });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            collegeId: user.collegeId,
            role: user.role,
            subject: user.subject, // Will be undefined for students, which is fine.
            token: generateToken(user._id, user.role, user.subject),
        });
    } else {
        res.status(401);
        throw new Error('Invalid college ID or password');
    }
});

module.exports = { registerUser, authUser };