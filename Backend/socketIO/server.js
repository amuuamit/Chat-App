import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(
  cors({
    origin: "https://chat-app-5-ttcs.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Configure cookie parser
app.use(cookieParser());

// Configure body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "https://chat-app-5-ttcs.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

let onlineUsers = [];

const addNewUser = (username, socketId) => {
  !onlineUsers.some((user) => user.username === username) &&
    onlineUsers.push({ username, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (username) => {
  return onlineUsers.find((user) => user.username === username);
};

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on("error", (err) => {
    console.log(`Socket error: ${err.message}`);
  });

  // Add new user
  socket.on("newUser", (username) => {
    console.log("New user joined:", username);
    addNewUser(username, socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });

  // Join chat room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Send and receive messages
  socket.on("send_message", (data) => {
    console.log("Message received:", data);
    socket.to(data.roomId).emit("receive_message", data);
  });

  // Handle typing status
  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("user_typing", {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client is Disconnected", socket.id);
    removeUser(socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

export { app, io, server };
