require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

connectDB();

console.log('MONGODB_URI being used:', process.env.MONGODB_URI);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// --- Socket.IO Authentication Middleware ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user; // Attach user payload to socket object
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token.'));
  }
});

// Store active typing users (userId -> username)
const typingUsers = {};

// --- Socket.IO Event Handling ---
io.on('connection', (socket) => {
  console.log(`User connected to Socket.IO: ${socket.id} (User ID: ${socket.user.id})`);

  // Listen for 'sendMessage' event from clients
  socket.on('sendMessage', async (data) => {
    try {
      const newMessage = new Message({
        sender: socket.user.username, // Always use authenticated username
        senderId: socket.user.id,
        text: data.text,
        timestamp: new Date(),
        replyTo: data.replyTo || null // NEW: Save replyTo message ID if provided
      });

      await newMessage.save();

      // Populate the replyTo field before emitting, so frontend gets reply details
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('replyTo', 'sender text timestamp'); // Get sender, text, timestamp of replied message

      io.emit('receiveMessage', populatedMessage); // Emit the populated message

      // Stop typing for this user after message is sent
      if (typingUsers[socket.user.id]) {
        delete typingUsers[socket.user.id];
        socket.broadcast.emit('userStopTyping', { userId: socket.user.id });
      }

    } catch (error) {
      console.error('Error saving message or emitting:', error);
      socket.emit('messageError', { message: 'Failed to send message', error: error.message });
    }
  });

  // NEW: Listen for 'typing' event
  socket.on('typing', () => {
    if (!typingUsers[socket.user.id]) {
      typingUsers[socket.user.id] = socket.user.username;
      // Broadcast to all other clients that this user is typing
      socket.broadcast.emit('userTyping', { userId: socket.user.id, username: socket.user.username });
    }
  });

  // NEW: Listen for 'stopTyping' event
  socket.on('stopTyping', () => {
    if (typingUsers[socket.user.id]) {
      delete typingUsers[socket.user.id];
      // Broadcast to all other clients that this user stopped typing
      socket.broadcast.emit('userStopTyping', { userId: socket.user.id });
    }
  });

  // NEW: Listen for 'deleteMessage' event (from dashboard/admin actions)
  socket.on('deleteMessage', async (messageId) => {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        socket.emit('messageError', { message: 'Message not found for deletion.' });
        return;
      }

      // Authorization check: Only sender or admin (if you implement roles) can delete
      if (message.senderId.toString() !== socket.user.id) {
        socket.emit('messageError', { message: 'Not authorized to delete this message.' });
        return;
      }

      await message.deleteOne();
      io.emit('messageDeleted', { messageId: messageId }); // Notify all clients
    } catch (error) {
      console.error('Error deleting message via socket:', error);
      socket.emit('messageError', { message: 'Failed to delete message.', error: error.message });
    }
  });


  // Listen for client disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected from Socket.IO: ${socket.id} (User ID: ${socket.user ? socket.user.id : 'N/A'})`);
    // Remove user from typing list if they disconnect
    if (typingUsers[socket.user.id]) {
      delete typingUsers[socket.user.id];
      socket.broadcast.emit('userStopTyping', { userId: socket.user.id });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});