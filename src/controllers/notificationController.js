import Notification from "../models/notificationModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import webpush from "web-push";
import User from "../models/userModel.js";

// Configure Web Push with your VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export const getNotifications = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const notification = await Notification.find({
    recipient: req.user._id,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("actor", "name avatar");

  // Also get unread count
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });
  res.status(201).json({ success: true, data: { notification, unreadCount } });
});

// Mark a single notification as read
export const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipient: req.user._id,
    },
    { read: true },
    { new: true },
  );
  res.status(201).json({ success: true, data: notification });
});

//Mark all notifications as read
export const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    {
      recipient: req.user._id,
      read: false,
    },
    { read: true },
  );
  res
    .status(200)
    .json({ success: true, data: "All notifications marked as read" });
});

export const subscribeToPush = catchAsync(async (req, res) => {
  const subscription = req.body;
  // Save the subscription object to the logged-in user
  await User.findByIdAndUpdate(req.user._id, {
    pushSubscription: subscription,
  });
  res.status(200).json({
    success: true,
    message: "Successfully subscribed to push notifications.",
  });
});

export const testPush = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || !user.pushSubscription || !user.pushSubscription.endpoint) {
    return res
      .status(400)
      .json({ success: false, error: "User has no push subscription saved." });
  }

  const payload = JSON.stringify({
    title: "Backend Push Test",
    body: "Your Service Worker successfully woke up!",
    url: "http://localhost:5173",
  });

  await webpush.sendNotification(user.pushSubscription, payload);
  res.status(200).json({ success: true, message: "Push sent!" });
});
