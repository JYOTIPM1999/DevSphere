import { catchAsync } from "../utils/catchAsync.js";
import Message from "../models/messageModel.js";

export const getMessages = catchAsync(async (req, res) => {
  const { conversationId } = req.params;

  // Fetch messages and populate the sender's name/avatar (crucial for group chats!)
  const messages = await Message.find({
    conversationId,
  })
    .sort({ createAt: 1 })
    .populate("sender", "name avatar");

  res.status(200).json({ success: true, data: messages });
});
