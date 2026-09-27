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
import { startDigestJob } from "./cron/digestJob.js";
import "./queue/workers.js";
import "./config/passport.js";
import passport from "passport";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { API_PREFIX } from "./config/constants.js";
import { setupSwagger } from "./config/swagger.js";
import { ApolloServer } from "@apollo/server";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import { expressMiddleware } from "@as-integrations/express4";

if (process.env.NODE_ENV !== "test") {
  connectDB();
  startDigestJob();
}
const app = express();
// 1. Security Headers & CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Crucial for Apollo UI
          "https://cdn.socket.io",
          "https://embeddable-sandbox.cdn.apollographql.com",
        ], // Allow socket.io and Apollo Sandbox scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Crucial for Apollo UI
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // Allow Cloudinary images if you use it later
        frameSrc: ["'self'", "https://sandbox.embed.apollographql.com"], // Allow Apollo Sandbox iframe
        objectSrc: ["'none'"], // Prevent Flash/Java plugins
        upgradeInsecureRequests: [], // Force HTTPS
      },
    },
  }),
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:5173",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://studio.apollographql.com", // Allows Sandbox to read your GraphQL schema
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

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

console.log("PORT:", PORT);
console.log("MONGO_URI:", MONGO_URI);

// Initialize Swagger Docs  before route declarations so the documentation page
// doesn't get caught by any of your global API rate limiters.
setupSwagger(app);
app.use(`${API_PREFIX}`, globalLimiter);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/posts`, postRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/conversation`, conversationRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/media`, mediaRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// --- NEW APOLLO SERVER SETUP ---
const startApolloServer = async () => {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });
  // Use Top-Level Await so Express halts and mounts this BEFORE the error handler
  if (process.env.NODE_ENV !== "test") {
    // We must await server.start() before applying it to Express
    await apolloServer.start();

    // Mount GraphQL strictly at the /graphql endpoint
    app.use("/graphql", expressMiddleware(apolloServer));
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
  }
};
// Start it (unless we are in the test environment)
if (process.env.NODE_ENV !== "test") {
  startApolloServer();
}

// Add the error handler right here, AFTER all routes
app.use(errorHandler);

// --- NEW SERVER SETUP ---
const server = http.createServer(app);
setupSocket(server);

// To make your app testable by Supertest without it automatically
// starting the real server on port 3000, you should open your src/index.js and wrap the server.listen()

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
export { app, server };
