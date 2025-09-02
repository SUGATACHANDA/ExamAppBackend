// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('../config/db.js');
const { notFound, errorHandler } = require('../middlewares/errorMiddleware.js');

// Route Imports
const authRoutes = require('../routes/authRoutes.js');
const questionRoutes = require('../routes/questionRoutes.js');
const examRoutes = require('../routes/examRoutes.js');
const resultRoutes = require('../routes/resultRoutes.js');

dotenv.config();
connectDB();

const app = express();
app.use(express.json()); // to accept json data
app.use(cors()); // to allow cross-origin requests

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);

app.get('/', (req, res) => {
    res.send('Exam App API is running...');
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Setup for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, restrict this to your app's URL
        methods: ["GET", "POST"]
    }
});
app.set('io', io); // Make io accessible in controllers

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Proctoring and WebRTC Signaling ---

    // Teacher joins a room to monitor an exam
    socket.on('join_proctoring_room', (examId) => {
        const roomName = `exam_proctor_${examId}`;
        socket.join(roomName);
        console.log(`Teacher ${socket.id} joined proctoring room: ${roomName}`);
    });

    // Student joins the same exam room to be monitored
    socket.on('join_exam_room', ({ examId, studentId, studentName }) => {
        const roomName = `exam_proctor_${examId}`;
        socket.join(roomName);
        console.log(`Student ${socket.id} (${studentName}) joined exam room: ${roomName}`);

        // Notify the teacher(s) in the room that a new student has joined
        socket.to(roomName).emit('student_joined', { studentId, studentName, socketId: socket.id });
    });

    // WebRTC Signaling: Teacher initiates connection to a student
    socket.on('webrtc_offer', ({ offer, targetSocketId }) => {
        // Send the offer to the specific student
        io.to(targetSocketId).emit('webrtc_offer', { offer, fromSocketId: socket.id });
    });

    // WebRTC Signaling: Student sends answer back to teacher
    socket.on('webrtc_answer', ({ answer, targetSocketId }) => {
        // Send the answer back to the specific teacher
        io.to(targetSocketId).emit('webrtc_answer', { answer, fromSocketId: socket.id });
    });

    // WebRTC Signaling: Exchanging ICE candidates
    socket.on('webrtc_ice_candidate', ({ candidate, targetSocketId }) => {
        io.to(targetSocketId).emit('webrtc_ice_candidate', { candidate, fromSocketId: socket.id });
    });

    // Teacher forces a student to be expelled
    socket.on('expel_student', ({ studentSocketId }) => {
        io.to(studentSocketId).emit('exam_expelled');
        console.log(`Expel signal sent to student with socket ID: ${studentSocketId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Optionally, emit an event to the room to notify that a user has disconnected
    });
});

server.listen(PORT, console.log(`Server running on port ${PORT}`));