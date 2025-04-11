import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/authProvider.jsx";
import { useParams } from "react-router-dom";
import axios from "axios";
import server from "../../environment.js";
import { toast } from "react-hot-toast";
import { IoMdSend } from "react-icons/io";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { useSocket } from "../context/socketContext.jsx";
import { useChat } from "../context/chatProvider.jsx";

const ChatBox = ({ selectedChat: propSelectedChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { chatId } = useParams();
  const { authUser } = useAuth();
  const socket = useSocket();
  const { chats } = useChat();
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Debug logs
  // useEffect(() => {
  //   console.log("ChatBox - propSelectedChat:", propSelectedChat);
  //   console.log("ChatBox - chatId:", chatId);
  //   console.log("ChatBox - authUser:", authUser);
  // }, [propSelectedChat, chatId, authUser]);

  const selectedChat =
    propSelectedChat || chats.find((chat) => chat._id === chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  console.log("User", authUser);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?._id) {
        console.log("No chat selected, skipping message fetch");
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching messages for chat:", selectedChat._id);
        const response = await axios.get(
          `${server}/message/${selectedChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${authUser?.token}`,
            },
          }
        );
        console.log("Messages fetched:", response.data);
        setMessages(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat?._id, authUser?.token]);

  useEffect(() => {
    if (socket) {
      socket.on("receive_message", (newMessage) => {
        if (selectedChat?._id && newMessage.chat._id === selectedChat._id) {
          console.log("New message received:", newMessage);
          setMessages((prev) => [...prev, newMessage]);
        }
      });

      return () => {
        socket.off("receive_message");
      };
    }
  }, [socket, selectedChat?._id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?._id) return;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authUser?.token}`,
        },
      };

      const messageData = {
        content: newMessage.trim(),
        chatId: selectedChat._id,
      };

      console.log("Sending message:", messageData);
      const response = await axios.post(
        `${server}/message`,
        messageData,
        config
      );

      if (response.data && socket) {
        console.log("Message sent successfully:", response.data);
        socket.emit("send_message", response.data);
        setMessages((prev) => [...prev, response.data]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-white">
        <p className="text-gray-400">Select a chat to start messaging</p>
      </div>
    );
  }

  const otherUser = selectedChat.users.find(
    (user) => user._id !== authUser?._id
  );

  console.log("Rendering chat with otherUser:", otherUser);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
            {otherUser?.profilePic ? (
              <img
                src={otherUser.profilePic}
                alt={otherUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-lg">
                {otherUser?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {selectedChat.isGroupChat
                ? selectedChat.chatName
                : otherUser?.name}
            </h2>
            <p className="text-sm text-gray-400">
              {selectedChat.isGroupChat
                ? `${selectedChat.users.length} members`
                : otherUser?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.sender._id === authUser?._id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender._id === authUser?._id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <BsEmojiSmile size={24} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            className={`p-2 rounded-full ${
              loading || !newMessage.trim()
                ? "bg-gray-600 text-gray-400"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition-colors`}
          >
            <IoMdSend size={24} />
          </button>
        </div>
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-0 mb-2"
          >
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setNewMessage((prev) => prev + emojiObject.emoji);
                setShowEmojiPicker(false);
              }}
              width={300}
              height={400}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
