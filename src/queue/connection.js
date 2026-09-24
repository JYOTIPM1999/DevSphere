import "dotenv/config";
import Redis from "ioredis";

// Debug check: This will tell you if the .env variable is loading
if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL is completely missing! Check your .env file.");
} else {
  console.log("✅ Redis URL loaded successfully.");
}
// BullMQ requires maxRetriesPerRequest to be null
// export const connection = new Redis(process.env.REDIS_URL, {
//   maxRetriesPerRequest: null,
//   tls: {}, // Force TLS connection for Upstash
// });

// Export a dummy object during tests, otherwise connect to real Redis
// Add setex, get, and del to the mock object
export const connection =
  process.env.NODE_ENV === "test"
    ? {
        status: "ready",
        on: () => {},
        setex: async () => "OK",
        get: async () => null,
        del: async () => 1,
      }
    : new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        tls: {}, // Force TLS connection for Upstash
      });
