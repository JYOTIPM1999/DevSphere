import { Queue } from "bullmq";

import { connection } from "./connection.js";

export const emailQueue = new Queue("email-queue", { connection });
export const digestQueue = new Queue("digest-queue", { connection });
