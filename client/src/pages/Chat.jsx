// src/pages/Chat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Simple debounce function
const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

function Chat() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // { userId: username }
  const [replyingTo, setReplyingTo] = useState(null); // { _id: messageId, sender: username, text: messageText }
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Redirect if not authenticated and not loading
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate]);

  // Socket.IO connection and event listeners
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    socketRef.current = io(backendUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      if (err.message.includes('Authentication error')) {
        alert('Authentication failed for chat. Please log in again.');
        logout();
      }
    });

    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // NEW: Handle typing events
    socketRef.current.on('userTyping', ({ userId, username }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: username }));
    });

    socketRef.current.on('userStopTyping', ({ userId }) => {
      setTypingUsers((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    });

    // NEW: Handle message deletion via socket (e.g., from dashboard)
    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
    });


    // Fetch historical messages
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/messages`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching historical messages:', error.response?.data?.message || error.message);
        if (error.response && error.response.status === 401) {
          alert('Session expired or invalid. Please log in again.');
          logout();
        }
      }
    };

    fetchMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user, logout, navigate, backendUrl]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]); // Also scroll when typing users change

  // Debounced function to emit stopTyping
  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (socketRef.current) {
        socketRef.current.emit('stopTyping');
      }
    }, 1000), // Emit stopTyping 1 second after last key press
    []
  );

  const handleNewMessageChange = (e) => {
    setNewMessageText(e.target.value);
    if (socketRef.current && user) {
      if (e.target.value.length > 0) {
        socketRef.current.emit('typing');
      } else {
        socketRef.current.emit('stopTyping');
      }
      debouncedStopTyping(); // Schedule stop typing
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessageText.trim() && socketRef.current && user) {
      const messageData = {
        sender: user.username,
        text: newMessageText,
      };
      if (replyingTo) {
        messageData.replyTo = replyingTo._id; // Add replyTo ID
      }
      socketRef.current.emit('sendMessage', messageData);
      setNewMessageText('');
      setReplyingTo(null); // Clear replyingTo state after sending
      debouncedStopTyping.cancel(); // Cancel any pending stop typing calls
      if (socketRef.current) {
        socketRef.current.emit('stopTyping'); // Explicitly stop typing
      }
    }
  };

  const handleReplyClick = (message) => {
    setReplyingTo({
      _id: message._id,
      sender: message.sender,
      text: message.text,
    });
  };

  const clearReplyingTo = () => {
    setReplyingTo(null);
  };

  const otherTypingUsers = Object.values(typingUsers).filter(
    (username) => username !== user?.username
  );

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans text-xl text-gray-700">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md md:max-w-lg lg:max-w-xl flex flex-col h-[80vh] md:h-[70vh] overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-5 rounded-t-xl shadow-md flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Chat Room</h1>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm sm:text-base">Online</span>
          </div>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500 text-lg">
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex mb-4 ${
                  msg.senderId === user.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                    msg.senderId === user.id
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.replyTo && ( // Display replied message if exists
                    <div className="bg-opacity-20 bg-gray-400 p-2 rounded-md mb-2 border-l-4 border-blue-300">
                      <p className="text-xs font-semibold text-gray-600">
                        Replying to {msg.replyTo.sender}:
                      </p>
                      <p className="text-sm italic truncate">{msg.replyTo.text}</p>
                    </div>
                  )}
                  <p className="font-semibold text-sm mb-1">
                    {msg.senderId === user.id ? 'You' : msg.sender}
                  </p>
                  <p className="text-base break-words">{msg.text}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-300">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                    <button
                      onClick={() => handleReplyClick(msg)}
                      className="ml-2 text-xs text-blue-200 hover:text-blue-100 transition duration-200"
                      title="Reply to this message"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {otherTypingUsers.length > 0 && (
          <div className="px-4 py-2 text-sm text-gray-600 bg-gray-100 border-t border-gray-200">
            {otherTypingUsers.join(', ')} is typing...
          </div>
        )}

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex flex-col space-y-2">
          {replyingTo && ( // Display replying to message
            <div className="bg-blue-100 border border-blue-300 p-2 rounded-md flex justify-between items-center text-sm text-gray-700">
              <span>
                Replying to <span className="font-semibold">{replyingTo.sender}</span>: "{replyingTo.text.substring(0, 30)}{replyingTo.text.length > 30 ? '...' : ''}"
              </span>
              <button
                type="button"
                onClick={clearReplyingTo}
                className="ml-2 text-red-500 hover:text-red-700 font-bold"
                title="Clear reply"
              >
                &times;
              </button>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newMessageText}
              onChange={handleNewMessageChange}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-gray-800"
              disabled={!isAuthenticated}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 flex items-center justify-center"
              aria-label="Send message"
              disabled={!isAuthenticated || !newMessageText.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat;