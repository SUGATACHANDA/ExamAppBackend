const { Server } = require("socket.io")

const io = new Server({
    // Vercel can sometimes handle polling, but websocket is still more reliable
    transports: ['websocket', 'polling'],
    cors: {
        origin: '*',
    },
});

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
    socket.on('disconnecting', () => {
        // `socket.rooms` is a Set which includes the socket's own ID.
        // We find the room that isn't the socket's own ID.
        const rooms = Array.from(socket.rooms);
        const examRoom = rooms.find(room => room !== socket.id);

        if (examRoom) {
            // Notify everyone else in the room that this socket ID has left.
            socket.to(examRoom).emit('peer_disconnected', socket.id);
        }
    });
});

export default (req, res) => {
    if (req.method === "POST") {
        // You can add logic here for POST requests if needed
    }
    // The server engine handles the upgrade to WebSocket
    io.attach(res.socket.server);
    res.end();
};