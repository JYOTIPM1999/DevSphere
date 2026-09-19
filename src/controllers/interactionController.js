import Comment from "../models/commentModel.js";
import Like from "../models/likeModel.js";
import Follow from "../models/followModel.js";
import { catchAsync } from "../utils/catchAsync.js";

export const toggleLike = catchAsync(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;

  const existingLike = await Like.findOne({ user: userId, post: postId });

  if (existingLike) {
    console.log("exist like", existingLike);

    const data = await existingLike.deleteOne();
    console.log("deleted", data);
    return res.status(200).json({ success: true, data: { liked: false } });
  }
  await Like.create({ user: userId, post: postId });
  res.status(200).json({ success: true, data: { liked: true } });
});

export const addComment = catchAsync(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    res.status(400);
    throw new Error("Comment content is required");
  }

  const comment = await Comment.create({
    content,
    post: req.params.id,
    author: req.user._id,
  });
  // Populate the author so the frontend gets the name/avatar immediately
  await comment.populate("author", "name avatar");
  res.status(201).json({ success: true, data: comment });
});

export const getComments = catchAsync(async (req, res) => {
  const post = req.params.id;

  const comments = await Comment.find({ post: post })
    .sort({ createdAt: -1 })
    .populate("author", "name avatar");

  res.status(200).json({ success: true, data: comments });
});

export const toggleFollow = catchAsync(async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id;
  if (targetUserId === currentUserId.toString()) {
    res.status(400);
    throw new Error("You can't follow youself");
  }
  const existingFollow = await Follow.findOne({
    follower: currentUserId,
    following: targetUserId,
  });
  if (existingFollow) {
    await existingFollow.deleteOne();
    return res.status(200).json({ success: true, data: { followed: false } });
  }
  await Follow.create({ follower: currentUserId, following: targetUserId });
  res.status(200).json({ success: true, data: { followed: true } });
});
