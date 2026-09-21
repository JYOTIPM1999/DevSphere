import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

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

    // 1. Join a specific conversation room
    socket.on("join_room", (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined room ${conversationId}`);
    });

    // 2. Leave room (when closing the chat window)
    socket.on("leave_room", (conversationId) => {
      socket.leave(conversationId);
    });

    // 3. Volatile Typing Indicators (No DB hits!)
    // socket.to(room).emit sends to everyone in the room EXCEPT the sender
    socket.on("typing_start", (conversationId) => {
      socket
        .to(conversationId)
        .emit("typing_start", { conversationId, userId });
    });

    socket.on("typing_stop", (conversationId) => {
      socket.to(conversationId).emit("ty[ing_stop", { conversationId, userId });
    });

    // 4. Send Message (Room broadcast + DB save)

    socket.on("send_message", async (data) => {
      const { conversationId, content } = data;

      //save to db
      const message = await Message.create({
        conversationId,
        sender: userId,
        content,
      });
      // Update the conversation's lastMessage for inbox sorting
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
      });
      // Broadcast to everyone in the room (including the sender, so their UI updates)
      io.in(conversationId).emit("receive_message", message);
    });
    // 5. Read Receipt Pointer Update
    socket.on("message_read", async (conversationId) => {
      const now = Date.now();
      // Update this specific user's pointer in the array
      await Conversation.updateOne({
        _id: conversationId,
        "participants.user": userId,
      });
      // Tell the room this user has read up to this point
      socket
        .to(conversationId)
        .emit("receipt_updated", { conversationId, userId, lastRead: now });
    });
  });
};
