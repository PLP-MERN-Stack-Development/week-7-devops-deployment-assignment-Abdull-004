// chat-app-backend/controllers/messageController.js
const Message = require('../models/Message');

// @desc    Get all messages (historical chat)
// @route   GET /api/messages
// @access  Private (requires authentication)
exports.getMessages = async (req, res) => {
  try {
    // Populate replyTo field to get details of the replied message
    const messages = await Message.find()
      .populate('replyTo', 'sender text timestamp') // Only get sender, text, timestamp of replied message
      .sort({ timestamp: 1 })
      .limit(200); // Increased limit for more history

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error fetching messages.', error: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private (only sender can delete their own message)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Check if the authenticated user is the sender of the message
    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message.' });
    }

    await message.deleteOne(); // Use deleteOne() or remove()
    res.status(200).json({ message: 'Message deleted successfully.', messageId: req.params.id });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error deleting message.', error: error.message });
  }
};