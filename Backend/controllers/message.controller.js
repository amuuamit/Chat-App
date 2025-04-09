import { Message, Chat } from "../models/chat.model.js";
import User from "../models/user.model.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      console.error("Missing required fields:", { content, chatId });
      return res.status(400).json({
        message: "Invalid data passed into request",
        details: "Content and chatId are required",
      });
    }

    if (!req.user || !req.user._id) {
      console.error("User not authenticated");
      return res.status(401).json({ message: "User not authenticated" });
    }

    let message = await Message.create({
      sender: req.user._id,
      content: content.trim(),
      chat: chatId,
    });

    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name email",
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    console.log("Message sent successfully:", message);
    res.json(message);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(400).json({
      message: "Error sending message",
      error: error.message,
    });
  }
};

// Fetch all messages for a chat
export const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
