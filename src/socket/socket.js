import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/messageModel.js";

// In-memory map to track who is online (userId -> socketId)
const userSocketMap = new Map();

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Socket middleware to verify JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error no token provided"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded; // Attach user payload to socket
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  //socket connection
  io.on("connection", (socket) => {
    const userId = socket.user.id;

    // 1. Map user ID to their current socket ID
    userSocketMap.set(userId, socket.id);

    // 2. Broadcast to everyone else that this user is online
    socket.broadcast.emit("user_online", { userId });

    // 3. Listen for new messages
    socket.on("send_message", async (data) => {
      const { receiverId, content } = data;
      // Save message to DB (This handles the "offline receiver" concept inherently.
      // If they aren't online, it's safe in the DB for their next REST fetch).
      const message = await Message.create({
        sender: userId,
        receiver: receiverId,
        content,
      });

      // If the receiver is online, push the live message to their specific socket
      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", message);
      }
    });
    // 4. Handle Disconnect
    socket.on("disconnect", () => {
      userSocketMap.delete(userId);
      io.emit("user_offline", { userId });
    });
  });
};
