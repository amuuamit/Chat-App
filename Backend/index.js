import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server } from "socket.io";
import userRoutes from "./route/user.route.js";
import chatRoutes from "./route/chat.route.js";
import messageRoutes from "./route/message.route.js";
import mongoose from "mongoose";
import path from "path";

dotenv.config();

const __dirname = path.resolve();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(
  cors({
    origin: "https://chat-app-5-ttcs.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "https://chat-app-5-ttcs.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Routes
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/message", messageRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on("error", (err) => {
    console.log(`Socket error: ${err.message}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;

// __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "/Frontend/dist")));
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "Frontend", "dist", "index.html"));
});

mongoose
  .connect(URI)
  .then(() => {
    console.log("Mongodb connected successfully");
  })
  .catch((error) => {
    console.error("Mongodb connection error:", error);
    process.exit(1);
  });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app, io, server };
