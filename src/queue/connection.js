import "dotenv/config";
import Redis from "ioredis";

// Debug check: This will tell you if the .env variable is loading
if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL is completely missing! Check your .env file.");
} else {
  console.log("✅ Redis URL loaded successfully.");
}
// BullMQ requires maxRetriesPerRequest to be null
export const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}, // Force TLS connection for Upstash
});
