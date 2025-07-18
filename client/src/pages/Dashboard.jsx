// src/pages/Dashboard.jsx

import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'; // Import the modal

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate]);

  // Fetch messages for the dashboard
  const fetchMessages = async () => {
    if (!isAuthenticated) return;
    setLoadingMessages(true);
    setError(null);
    try {
      const response = await axios.get(`${backendUrl}/api/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      // Filter messages to show only current user's messages for management
      // Or show all messages if you want an admin-like view
      setMessages(response.data.filter(msg => msg.senderId === user.id));
      setLoadingMessages(false);
    } catch (err) {
      console.error('Error fetching messages for dashboard:', err.response?.data?.message || err.message);
      setError('Failed to fetch messages. Please try again.');
      setLoadingMessages(false);
      if (err.response && err.response.status === 401) {
        alert('Session expired or invalid. Please log in again.');
        logout();
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [isAuthenticated]); // Fetch when auth state changes

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      await axios.delete(`${backendUrl}/api/messages/${messageToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setAlertMessage('Message deleted successfully!');
      setShowAlert(true);
      // Remove the message from the local state
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageToDelete._id)
      );
    } catch (err) {
      console.error('Error deleting message:', err.response?.data?.message || err.message);
      setAlertMessage(`Failed to delete message: ${err.response?.data?.message || err.message}`);
      setShowAlert(true);
    } finally {
      setShowDeleteModal(false);
      setMessageToDelete(null);
      setTimeout(() => setShowAlert(false), 3000); // Hide alert after 3 seconds
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans text-xl text-gray-700">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Messages Dashboard</h2>

        {showAlert && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{alertMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loadingMessages ? (
          <p className="text-center text-gray-600">Loading your messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-600">You haven't sent any messages yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map((msg) => (
                  <tr key={msg._id}>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                      {msg.text}
                      {msg.replyTo && (
                        <div className="mt-1 text-xs text-gray-500 italic border-l-2 pl-2">
                          Replying to {msg.replyTo.sender}: "{msg.replyTo.text}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(msg.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClick(msg)}
                        className="text-red-600 hover:text-red-900 transition duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        message={`Are you sure you want to delete this message: "${messageToDelete?.text}"?`}
      />
    </div>
  );
}

export default Dashboard;