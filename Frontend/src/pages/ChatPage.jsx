import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authProvider.jsx";
import { useChat } from "../context/chatProvider.jsx";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../main.jsx";
import { toast } from "react-hot-toast";
import ChatSidebar from "../components/ChatSidebar.jsx";
import ChatArea from "../components/ChatArea.jsx";
import { IoArrowBack } from "react-icons/io5";

const ChatPage = () => {
  const { authUser } = useAuth();
  const { selectedChat, setSelectedChat, chats, setChats } = useChat();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false); // Combined loading state
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Get the other user's details from the selected chat
  const getOtherUser = () => {
    if (!selectedChat || selectedChat.isGroupChat) return null;
    return selectedChat.users.find((user) => user._id !== authUser._id);
  };

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    const fetchChatData = async () => {
      if (!chatId) return;

      setLoading(true);
      try {
        // Fetch Chat Details
        const chatResponse = await axios.get(`${server}/chat/${chatId}`, {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
            "Content-Type": "application/json",
          },
        });
        setSelectedChat(chatResponse.data);
        setShowChat(true);

        // Fetch Messages
        const messageResponse = await axios.get(`${server}/message/${chatId}`, {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
          },
          withCredentials: true,
        });
        setMessages(messageResponse.data);
      } catch (error) {
        console.error("Error fetching chat or messages:", error);
        setError(
          error.response?.data?.message || "Failed to load chat or messages."
        );
        toast.error(
          error.response?.data?.message || "Failed to load chat or messages."
        );

        // Redirect if chat is not found or user is unauthorized
        if (error.response?.status === 404 || error.response?.status === 403) {
          navigate("/chat");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [authUser, navigate, chatId, setSelectedChat]);

  const handleUserSelect = async (user) => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${server}/chat`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
          },
          withCredentials: true,
        }
      );

      setSelectedChat(data);
      setChats([data, ...chats]);
      setShowChat(true); // Show chat area in mobile view
      navigate(`/chat/${data._id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error(error.response?.data?.message || "Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToChats = () => {
    setShowChat(false);
    setSelectedChat(null);
    navigate("/chat");
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/chat")}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="flex h-screen w-full max-w-full">
      {/* Mobile Header with User Info */}
      {showChat && (
        <div className="md:hidden fixed top-0 left-0 w-full bg-gray-900 p-2 z-20 border-b">
          <div className="flex items-center">
            <button
              onClick={handleBackToChats}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-2"
            >
              <IoArrowBack className="text-xl" />
            </button>
            {selectedChat?.isGroupChat ? (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                  <span className="text-gray-600 font-semibold">
                    {selectedChat.chatName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{selectedChat.chatName}</span>
              </div>
            ) : otherUser ? (
              <div className="flex items-center">
                {otherUser.pic ? (
                  <img
                    src={otherUser.pic}
                    alt={otherUser.name}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <span className="text-gray-600 font-semibold">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium">{otherUser.name}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Chat Sidebar - Hidden on mobile when chat is selected */}
      <div
        className={`${
          showChat ? "hidden md:block" : "block"
        } w-full md:w-1/4 md:min-w-[300px] border-r`}
      >
        <ChatSidebar onUserSelect={handleUserSelect} />
      </div>

      {/* Chat Area - Full width on mobile when selected */}
      <div
        className={`${
          showChat ? "block" : "hidden md:block"
        } w-full md:w-3/4 md:flex-1`}
      >
        {selectedChat ? (
          <ChatArea
            selectedChat={selectedChat}
            messages={messages}
            setMessages={setMessages}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
