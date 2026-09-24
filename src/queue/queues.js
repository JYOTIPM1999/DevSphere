import { Queue } from "bullmq";

import { connection } from "./connection.js";

// export const emailQueue = new Queue("email-queue", { connection });
// export const digestQueue = new Queue("digest-queue", { connection });
// If testing, export a mock queue. If running normally, export the real BullMQ Queue.
export const emailQueue =
  process.env.NODE_ENV === "test"
    ? { add: async () => console.log("Mock email job added") }
    : new Queue("email-queue", { connection });

export const digestQueue =
  process.env.NODE_ENV === "test"
    ? { add: async () => {} }
    : new Queue("digest-queue", { connection });
