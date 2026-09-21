import { catchAsync } from "../utils/catchAsync.js";
import Message from "../models/messageModel.js";

export const getMessages = catchAsync(async (req, res) => {
  const currentUserId = req.user._id;
  const otherUserId = req.params.userId;
  const page = parseInt(req.params.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId },
    ],
  })
    .sort({ createAt: 1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({ success: true, data: messages });
});
