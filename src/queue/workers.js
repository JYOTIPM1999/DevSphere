// A Worker listens to a specific queue and executes code when a job arrives.

import { Worker } from "bullmq";
import { sendEmail } from "../utils/sendEmail.js";
import { connection } from "./connection.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import { emailQueue } from "./queues.js";

export let emailWorker;
export let digestWorker;

// Only instantiate workers if we are NOT running tests
if (process.env.NODE_ENV !== "test") {
  emailWorker = new Worker(
    "email-queue",
    async (job) => {
      console.log(`Email worker processing job ${job.id} for ${job.data.to}`);

      // We pass the exact same parameters we used to pass to sendEmail
      await sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
      });
      console.log(`[Email Worker] Job ${job.id} completed successfully.`);
    },
    { connection },
  );

  digestWorker = new Worker(
    "digest-queue",
    async (job) => {
      console.log(`[Digest Worker] Processing daily digest...`);
      const usersWithNotifications = await Notification.distinct("recipient", {
        read: false,
      });

      for (const userId of usersWithNotifications) {
        const user = await User.findById(userId);
        const unreadCount = await Notification.countDocuments({
          recipient: userId,
          read: false,
        });
        if (user && unreadCount > 0) {
          const html = `<h2>Hello ${user.name},</h2><p>You have <strong>${unreadCount}</strong> unread notifications.</p>`;
          // Notice: The digest worker adds jobs to the email queue! Separation of concerns.
          await emailQueue.add("digest-email", {
            to: user.email,
            subject: "Daily Digest",
            html,
          });
        }
      }
    },
    { connection },
  );

  // --- ERROR HANDLING ---

  emailWorker.on("failed", (job, err) =>
    console.error(`[Email Worker] Job ${job.id} failed:`, err.message),
  );

  digestWorker.on("failed", (job, err) =>
    console.error(`[Digest Worker] Job ${job.id} failed:`, err.message),
  );
}
