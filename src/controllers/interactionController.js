import Comment from "../models/commentModel.js";
import Like from "../models/likeModel.js";
import Follow from "../models/followModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import Post from "../models/postModel.js";
import Notification from "../models/notificationModel.js";
import { sendLiveNotification } from "../socket/socket.js";

export const toggleLike = catchAsync(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;

  const existingLike = await Like.findOne({ user: userId, post: postId });

  if (existingLike) {
    const data = await existingLike.deleteOne();
    return res.status(200).json({ success: true, data: { liked: false } });
  }
  await Like.create({ user: userId, post: postId });
  // --- NOTIFICATION LOGIC ---
  // 1. Fetch the post to find out who to notify
  const post = await Post.findById(postId);

  // 2. Only notify if the liker isn't the post author
  if (post && post.author.toString() !== userId.toString()) {
    const notification = await Notification.create({
      recipient: post.author,
      actor: userId,
      type: "like",
      targetId: post._id,
    });

    // 3. Populate actor details for the live socket emit
    await notification.populate("actor", "name avatar");

    // 4. Push live!
    sendLiveNotification(post.author, notification);
  }
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

  // --- NOTIFICATION LOGIC ---
  // 1. We need the post to know who to notify
  const post = await Post.findById(req.params.id);

  // 2. Only notify if the commenter isn't the post author
  if (post && post.author.toString() !== req.user._id.toString()) {
    const notification = await Notification.create({
      recipient: post.author,
      actor: req.user._id,
      type: "comment",
      targetId: post._id,
    });
    // 3. Populate actor details for the live socket emit
    await notification.populate("actor", "name avatar");
    // 4. Push live!
    sendLiveNotification(post.author, notification);
  }
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
  // --- NOTIFICATION LOGIC ---
  // 1 & 2. We already know the recipient (targetUserId) and know they aren't the actor.
  const notification = await Notification.create({
    recipient: targetUserId,
    actor: currentUserId,
    type: "follow",
    targetId: currentUserId, // For a follow, the target is the person who followed them
  });

  // 3. Populate actor details for the live socket emit
  await notification.populate("actor", "name avatar");

  // 4. Push live!
  sendLiveNotification(targetUserId, notification);
  res.status(200).json({ success: true, data: { followed: true } });
});
