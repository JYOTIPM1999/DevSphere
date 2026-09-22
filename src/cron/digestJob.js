import cron from "node-cron";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";

//This script runs daily at 8:00 AM. It finds users with unread notifications,
// emails them a summary, and marks those specific notifications as emailed (so we don't spam them tomorrow).
export const startDigestJob = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("Running daily notification digest...");
    try {
      // Find all unique users who have unread notifications
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
          const html = `
                        <h2>Hello ${user.name},</h2>
                        <p>You have <strong>${unreadCount}</strong> unread notifications waiting for you on DevSphere.</p>
                        <a href="${process.env.FRONTEND_URL}/notifications">View Notifications</a>
                    `;

          await sendEmail({
            to: user.email,
            subject: "Your DevSphere Daily Digest",
            html,
          });
        }
      }
    } catch (error) {
      console.error("Digest Job Error:", error);
    }
  });
};
