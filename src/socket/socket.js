import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { connection as redis } from "../queue/connection.js";

let io; // Store io instance
const userSocketMap = new Map(); // Bring this back to track online users!

export const setupSocket = (server) => {
  io = new Server(server, {
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
  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    // --- NEW: Map user to socket in Redis instead of local memory ---
    // We add a 24-hour TTL just in case a server crashes without firing the disconnect event
    await redis.setex(`presence:${userId}`, 60 * 60 * 24, socket.id);
    console.log(`User ${userId} connected. Presence saved to Redis.`);

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
    // Inside your io.on('connection') block, update the send_message event:
    socket.on("send_message", async (data) => {
      const { conversationId, content } = data;

      //save to db
      const message = await Message.create({
        conversationId,
        sender: userId,
        content,
      });
      // Update the conversation's lastMessage for inbox sorting
      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          lastMessage: message._id,
        },
        { new: true }, // We need the updated doc to read participants
      );
      // Broadcast to everyone in the room (including the sender, so their UI updates)
      io.in(conversationId).emit("receive_message", message);
      // --- NEW NOTIFICATION LOGIC ---
      // Fan-out notifications to everyone in the group except the sender
      conversation.participants.forEach(async (participant) => {
        if (participant.user.toString() !== userId.toString()) {
          const notification = await Notification.create({
            recipient: participant.user,
            actor: userId,
            type: "message",
            targetId: conversationId,
          });
          await notification.populate("actor", "name avatar");
          sendLiveNotification(participant.user, notification); // Push live!
        }
      });
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

    socket.on("disconnect", async () => {
      // --- NEW: Remove presence from Redis ---
      await redis.del(`presence:${userId}`);
      console.log(`User ${userId} disconnected. Presence removed from Redis.`);
    });
  });
};

// --- NEW: Async Helper Function ---
// Controllers will call this to push live notifications
// It must be async now because it queries Redis
export const sendLiveNotification = async (recipientId, notification) => {
  if (!io) {
    return;
  }
  const socketId = await redis.get(`presence:${recipientId.toString()}`);
  if (socketId) {
    io.to(socketId).emit("new_notification", notification);
  }
};
