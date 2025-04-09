import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./authProvider.jsx";
import { useSocket } from "./socketContext.jsx";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);
  const { authUser } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    console.log("AuthUser in ChatContext:", authUser);
    if (authUser && socket) {
      if (authUser.username) {
        console.log("Emitting newUser with username:", authUser.username);
        socket.emit("newUser", authUser.username);
      } else {
        console.warn("authUser exists but username is missing:", authUser);
      }
    }
  }, [authUser, socket]);

  useEffect(() => {
    if (socket) {
      socket.on("getOnlineUsers", (users) => {
        console.log("Online users:", users);
      });

      socket.on("receive_message", (message) => {
        if (!selectedChat || selectedChat._id !== message.chat._id) {
          setNotification((prev) => [...prev, message]);
          // Update unread count for the chat
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat._id === message.chat._id
                ? {
                    ...chat,
                    unreadCount: (chat.unreadCount || 0) + 1,
                    latestMessage: message,
                  }
                : chat
            )
          );
        } else {
          // If chat is selected, update latest message without incrementing unread count
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat._id === message.chat._id
                ? { ...chat, latestMessage: message }
                : chat
            )
          );
        }
      });

      return () => {
        socket.off("getOnlineUsers");
        socket.off("receive_message");
      };
    }
  }, [socket, selectedChat]);

  const clearNotification = (chatId) => {
    setNotification((prev) =>
      prev.filter((notif) => notif.chat._id !== chatId)
    );
  };

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        clearNotification,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  return useContext(ChatContext);
};
