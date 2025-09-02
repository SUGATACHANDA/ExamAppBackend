// utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (id, role, subject) => {
    return jwt.sign({ id, role, subject }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

module.exports = generateToken;