import { useState, useEffect } from "react";
import { useChat } from "../context/chatProvider.jsx";
import { useAuth } from "../context/authProvider.jsx";
import axios from "axios";
import server from "../../environment.js";

const MyChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedChat, setSelectedChat, setChats: setGlobalChats } = useChat();
  const { authUser } = useAuth();

  useEffect(() => {
    const fetchChats = async () => {
      if (!authUser?.token) {
        setError("Please log in to view chats");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${server}/chat`, {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
            "Content-Type": "application/json",
          },
        });
        setChats(response.data);
        setGlobalChats(response.data); // Update global chat state
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError(error.response?.data?.message || "Failed to fetch chats");
        setLoading(false);
      }
    };

    fetchChats();
  }, [authUser?.token, setGlobalChats]);

  const getSenderName = (chat) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    const sender = chat.users.find((user) => user._id !== authUser?._id);
    return sender ? sender.name : "Unknown";
  };

  const getSenderAvatar = (chat) => {
    if (chat.isGroupChat) {
      return chat.chatName.charAt(0).toUpperCase();
    }
    const sender = chat.users.find((user) => user._id !== authUser?._id);
    return sender ? sender.name.charAt(0).toUpperCase() : "U";
  };

  const filteredChats = chats.filter((chat) => {
    const chatName = getSenderName(chat).toLowerCase();
    const searchTerm = searchQuery.toLowerCase();
    return chatName.includes(searchTerm);
  });

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    // Clear notifications for this chat
    setGlobalChats((prevChats) =>
      prevChats.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c))
    );
  };

  return (
    <div className="w-full md:w-[350px] lg:w-[400px] border-r border-slate-700 bg-slate-900 text-white">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">My Chats</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-8rem)]">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">
              {searchQuery ? "No matching chats found" : "No chats available"}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors duration-200 ${
                selectedChat?._id === chat._id ? "bg-slate-800" : ""
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                  {chat.users.find((user) => user._id !== authUser?._id)
                    ?.profilePic ? (
                    <img
                      src={
                        chat.users.find((user) => user._id !== authUser?._id)
                          .profilePic
                      }
                      alt={
                        chat.users.find((user) => user._id !== authUser?._id)
                          ?.name
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-lg">
                      {chat.users
                        .find((user) => user._id !== authUser?._id)
                        ?.name?.charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white truncate">
                      {chat.isGroupChat ? chat.chatName : getSenderName(chat)}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  {chat.latestMessage && (
                    <p className="text-sm text-gray-400 truncate">
                      {chat.latestMessage.sender._id === authUser?._id
                        ? "You: "
                        : ""}
                      {chat.latestMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyChats;
