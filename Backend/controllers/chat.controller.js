import { Chat, Message } from "../models/chat.model.js";
import User from "../models/user.model.js";

// Create or fetch one-to-one chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "UserId param not sent with request" });
  }

  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name email",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fetch all chats for a user
export const fetchChats = async (req, res) => {
  try {
    const results = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const populatedResults = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name email",
    });

    res.status(200).send(populatedResults);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create new group chat
export const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  const users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .json({ message: "More than 2 users are required to form a group chat" });
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Rename group chat
export const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: chatName,
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(404).json({ message: "Chat Not Found" });
    } else {
      res.json(updatedChat);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add user to group
export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const added = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      res.status(404).json({ message: "Chat Not Found" });
    } else {
      res.json(added);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove user from group
export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      res.status(404).json({ message: "Chat Not Found" });
    } else {
      res.json(removed);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get chat by ID
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if the user is part of the chat
    const isUserInChat = chat.users.some(
      (user) => user._id.toString() === req.user._id.toString()
    );

    if (!isUserInChat) {
      return res.status(403).json({ message: "You are not part of this chat" });
    }

    res.json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ message: "Error fetching chat" });
  }
};

export const updateChat = async (req, res) => {
  try {
    const { chatName, isGroupChat } = req.body;
    const chatId = req.params.id;

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of the chat
    const isUserInChat = chat.users.some(
      (user) => user.toString() === req.user._id.toString()
    );
    if (!isUserInChat) {
      return res.status(403).json({ message: "You are not part of this chat" });
    }

    // For group chats, check if user is admin
    if (
      chat.isGroupChat &&
      chat.groupAdmin.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Only group admin can update the chat" });
    }

    // Update chat
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: chatName || chat.chatName,
        isGroupChat: isGroupChat !== undefined ? isGroupChat : chat.isGroupChat,
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage");

    res.json(updatedChat);
  } catch (error) {
    console.error("Error updating chat:", error);
    res.status(500).json({ message: "Error updating chat" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of the chat
    const isUserInChat = chat.users.some(
      (user) => user.toString() === req.user._id.toString()
    );
    if (!isUserInChat) {
      return res.status(403).json({ message: "You are not part of this chat" });
    }

    // For group chats, check if user is admin
    if (
      chat.isGroupChat &&
      chat.groupAdmin.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Only group admin can delete the chat" });
    }

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chatId });

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Error deleting chat" });
  }
};
