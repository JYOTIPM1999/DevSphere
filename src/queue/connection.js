import "dotenv/config";
import Redis from "ioredis";

// Debug check: This will tell you if the .env variable is loading
if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL is completely missing! Check your .env file.");
} else {
  console.log("✅ Redis URL loaded successfully.");
}
// 1. Define base options needed for BullMQ/Redis
const redisOptions = {
  maxRetriesPerRequest: null,
};

// 2. Only attach TLS if the URL requires it (e.g., Upstash cloud uses rediss://)
if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith("rediss://")) {
  redisOptions.tls = {};
}

// 3. Export a dummy object during tests, otherwise connect to real Redis
export const connection =
  process.env.NODE_ENV === "test"
    ? {
        status: "ready",
        on: () => {},
        setex: async () => "OK",
        get: async () => null,
        del: async () => 1,
      }
    : new Redis(process.env.REDIS_URL, redisOptions);
