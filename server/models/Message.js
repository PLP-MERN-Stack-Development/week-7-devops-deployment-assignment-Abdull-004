// chat-app-backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  sender: { // This will be the username
    type: String,
    required: true
  },
  senderId: { // Link to the User who sent the message
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
   replyTo: { // NEW FIELD: Stores the ID of the message this one is replying to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
   timestamp: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;