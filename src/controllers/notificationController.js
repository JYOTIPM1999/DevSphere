import Notification from "../models/notificationModel.js";
import { catchAsync } from "../utils/catchAsync.js";

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
