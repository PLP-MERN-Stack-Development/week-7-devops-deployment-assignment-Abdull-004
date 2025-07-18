// chat-app-backend/routes/messageRoutes.js
const express = require('express');
const { getMessages, deleteMessage } = require('../controllers/messageController'); // Import deleteMessage
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMessages);
router.delete('/:id', protect, deleteMessage); // NEW: Route for deleting messages

module.exports = router;