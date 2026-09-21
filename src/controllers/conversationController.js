import Conversation from "../models/conversationModel.js";
import { catchAsync } from "../utils/catchAsync.js";

export const createConversation = catchAsync(async (req, res) => {
  const { participantIds, isGroup, name } = req.body;
  if (isGroup && (!name || participantIds.length < 2)) {
    res.status(400);
    throw new Error("Group require a name and al least 2 other participants");
  }
  const participants = [
    ...new Set([...participantIds, req.user._id.toString()]),
  ].map((id) => ({
    user: id,
    lastRead: new Date(),
  }));

  const conversation = await Conversation.create({
    name: isGroup ? name : "",
    isGroup,
    participants,
  });
  res.status(201).json({ success: true, data: conversation });
});

export const getConversations = catchAsync(async (req, res) => {
  const conversations = await Conversation.find({
    "participants.user": req.user._id,
  })
    .populate("participants.user", "name avatar")
    .populate("lastMessage")
    .sort({ createdAt: -1 });
  res.status(201).json({ success: true, data: conversations });
});
