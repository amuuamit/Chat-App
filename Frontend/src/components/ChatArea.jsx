import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authProvider.jsx";
import { useSocket } from "../context/socketContext.jsx";
import { IoMdSend, IoMdMore } from "react-icons/io";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import server from "../../environment.js";
import { toast } from "react-hot-toast";
import { useChat } from "../context/chatProvider";
import { useNavigate } from "react-router-dom";

const ChatArea = () => {
  const { socket, isConnected } = useSocket();
  const { selectedChat, setSelectedChat } = useChat();
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    if (selectedChat && isConnected) {
      console.log("Joining chat:", selectedChat._id);
      socket.emit("join chat", selectedChat._id);
    }

    return () => {
      if (selectedChat && isConnected) {
        console.log("Leaving chat:", selectedChat._id);
        socket.emit("leave chat", selectedChat._id);
      }
    };
  }, [selectedChat, socket, isConnected]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        setLoading(true);
        setError(null);
        console.log("Fetching messages for chat:", selectedChat._id);
        console.log("Auth token:", authUser.token);

        const response = await axios.get(
          `${server}/message/${selectedChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${authUser.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Messages response:", response.data);
        if (response.data) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError(error.response?.data?.message || "Failed to load messages");
        toast.error(error.response?.data?.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat, authUser.token]);

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    try {
      await axios.delete(`${server}/chat/${selectedChat._id}`, {
        headers: {
          Authorization: `Bearer ${authUser.token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Chat deleted successfully");
      setSelectedChat(null);
      navigate("/chat");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error(error.response?.data?.message || "Failed to delete chat");
    }
  };

  const handleEditChat = async () => {
    if (!selectedChat || !editedName.trim()) return;

    try {
      const response = await axios.put(
        `${server}/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: editedName,
        },
        {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSelectedChat(response.data);
      setIsEditing(false);
      toast.success("Chat name updated successfully");
    } catch (error) {
      console.error("Error updating chat:", error);
      toast.error(error.response?.data?.message || "Failed to update chat");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !isConnected) return;

    try {
      const response = await axios.post(
        `${server}/message`,
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setMessages([...messages, response.data]);
        socket.emit("new message", response.data);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  useEffect(() => {
    if (!isConnected) return;

    socket.on("message received", (newMessage) => {
      if (selectedChat && selectedChat._id === newMessage.chat._id) {
        setMessages([...messages, newMessage]);
      }
    });

    return () => {
      socket.off("message received");
    };
  }, [socket, selectedChat, messages, isConnected]);

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat Header */}
      <div className="p-2 sm:p-4 border-b bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            {selectedChat.isGroupChat ? (
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <span className="text-gray-600 font-semibold text-sm sm:text-base">
                    {selectedChat.chatName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-sm sm:text-base font-semibold border-b focus:outline-none focus:border-blue-500 w-full"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-sm sm:text-base font-semibold truncate">
                      {selectedChat.chatName}
                    </h2>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {selectedChat.users.length} members
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center flex-1 min-w-0">
                {(() => {
                  const otherUser = selectedChat.users.find(
                    (user) => user._id !== authUser._id
                  );
                  return (
                    <>
                      {otherUser.pic ? (
                        <img
                          src={otherUser.pic}
                          alt={otherUser.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                          <span className="text-gray-600 font-semibold text-sm sm:text-base">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-base font-semibold truncate">
                          {otherUser.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {otherUser.email}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="relative ml-2 sm:ml-4 flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <IoMdMore size={20} className="sm:w-6 sm:h-6" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-gray-900 rounded-md shadow-lg py-1 z-10">
                {selectedChat.isGroupChat && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditedName(selectedChat.chatName);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit Group Name
                    </button>
                    {isEditing && (
                      <button
                        onClick={handleEditChat}
                        className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-green-600 hover:bg-gray-100"
                      >
                        Save Changes
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handleDeleteChat}
                  className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-2 sm:p-4 w-full bg-cover bg-center"
        style={{ backgroundImage: "url('/backChat.jpg')" }}
      >
        {" "}
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${
              message.sender._id === authUser._id
                ? "justify-end"
                : "justify-start"
            } mb-2 sm:mb-4 w-full`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-lg ${
                message.sender._id === authUser._id
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm sm:text-base break-words">
                {message.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <form
        onSubmit={sendMessage}
        className="p-2 sm:p-4 border-t bg-gray-900 sticky bottom-0"
      >
        <div className="flex w-full">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!isConnected}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatArea;
