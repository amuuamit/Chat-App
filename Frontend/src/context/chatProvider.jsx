import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./authProvider.jsx";
import axios from "axios";
import server from "../../environment.js";
import { toast } from "react-hot-toast";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const { authUser } = useAuth();

  const fetchChats = async () => {
    if (!authUser?.token) {
      console.log("No auth token available");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${server}/chat`, {
        headers: {
          Authorization: `Bearer ${authUser.token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (response.data && Array.isArray(response.data)) {
        setChats(response.data);
      } else {
        console.error("Invalid chat data format:", response.data);
        toast.error("Failed to load chats: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching chats:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view chats.");
      } else if (error.response?.status === 404) {
        toast.error("Chat endpoint not found. Please check server connection.");
      } else {
        toast.error(error.response?.data?.message || "Failed to load chats");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.token) {
      fetchChats();
    }
  }, [authUser?.token]);

  const createChat = async (userId) => {
    if (!authUser?.token) {
      toast.error("Please login to create a chat");
      return;
    }

    try {
      const response = await axios.post(
        `${server}/chat`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data) {
        setChats((prev) => [response.data, ...prev]);
        setSelectedChat(response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error(error.response?.data?.message || "Failed to create chat");
      throw error;
    }
  };

  const updateChat = async (chatId, chatData) => {
    try {
      const { data } = await axios.put(`${server}/chat/${chatId}`, chatData, {
        headers: {
          Authorization: `Bearer ${authUser?.token}`,
        },
      });
      setChats((prev) =>
        prev.map((chat) => (chat._id === chatId ? data : chat))
      );
      setSelectedChat(data);
      return data;
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error;
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`${server}/chat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${authUser?.token}`,
        },
      });
      setChats((prev) => prev.filter((chat) => chat._id !== chatId));
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        loading,
        createChat,
        updateChat,
        deleteChat,
        fetchChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export default ChatProvider;
