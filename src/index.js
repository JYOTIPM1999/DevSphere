import http from "http";
import cookieParser from "cookie-parser";
import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoute.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { setupSocket } from "./socket/socket.js";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { startDigestJob } from "./cron/digestJob.js";
import "./queue/workers.js";
import "./config/passport.js";
import passport from "passport";

connectDB();
startDigestJob();
const app = express();
// 1. Security Headers & CORS
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:5173",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
    ], // Change this when you deploy your frontend
    credentials: true, // Crucial for your HTTP-only refresh token cookie
  }),
);

// 2. Parse Body & Cookies FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// 3. THEN Sanitize the parsed data
app.use(ExpressMongoSanitize());

// Rate Limiting for Auth routes (max 100 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

console.log("PORT:", PORT);
console.log("MONGO_URI:", MONGO_URI);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);

// Add the error handler right here, AFTER all routes
app.use(errorHandler);

// --- NEW SERVER SETUP ---
const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
