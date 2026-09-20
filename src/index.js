import http from "http";
import cookieParser from "cookie-parser";
import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoute.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { setupSocket } from "./socket/socket.js";

connectDB();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

console.log("PORT:", PORT);
console.log("MONGO_URI:", MONGO_URI);

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Add the error handler right here, AFTER all routes
app.use(errorHandler);

// --- NEW SERVER SETUP ---
const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
