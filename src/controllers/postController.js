import Post from "../models/postModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { postSchema } from "../utils/postValidator.js";
import Like from "../models/likeModel.js";
import Comment from "../models/commentModel.js";
import { connection as redis } from "../queue/connection.js";

export const createPost = catchAsync(async (req, res) => {
  const validatedData = postSchema.parse(req.body);

  let imageUrl = "";
  if (req.file) {
    imageUrl = req.file.path;
  }

  const post = await Post.create({
    content: validatedData.content,
    imageUrl: imageUrl,
    author: req.user?._id,
  });

  // --- NEW: Explicit Cache Invalidation ---
  // Find all cached feed pages and delete them so fresh data is fetched

  const keys = await redis.keys("cache:feed:*");
  if (keys.length > 0) {
    await redis.del(keys);
    console.log("Redis Cache Invalidated: feed");
  }
  res.status(201).json({ sucess: true, data: post });
});

export const getPosts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  // Create a unique cache key for this specific page and limit
  const cacheKey = `cache:feed:page:${page}:limit:${limit}`;

  // 1. Check redis cache
  const cachedFeed = await redis.get(cacheKey);

  if (cachedFeed) {
    console.log(`Redis Cache Hit: ${cacheKey}`);
    return res
      .status(200)
      .json({ success: true, data: JSON.parse(cachedFeed) });
  }
  console.log(`Redis Cache Miss: ${cacheKey} (Querying MongoDB)`);
  const skip = (page - 1) * limit;

  // 2. Fallback to MongoDB
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("author", "name avatar");

  // 3. Save to Redis with a 5-minute (300 seconds) Time-To-Live (TTL)
  await redis.setex(cacheKey, 300, JSON.stringify(posts));
  res.status(200).json({ success: true, data: posts });
});

export const getPost = catchAsync(async (req, res) => {
  const postId = req.params.id;
  // 1. Fetch the post
  const post = await Post.findById(req.params.id)
    .populate("author", "name avatar")
    .lean(); // .lean() converts mongoose doc to plain JS object so we can append properties

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  // 2. Fetch aggregate data concurrently
  const [likeCount, commentCount, userLike] = await Promise.all([
    Like.countDocuments({ post: postId }),
    Comment.countDocuments({ post: postId }),
    req.user ? Like.findOne({ user: req.user._id, post: postId }) : null, // Check if current logged-in user liked it
  ]);

  // 3. Attach data to the response object
  post.likeCount = likeCount;
  post.commentCount = commentCount;
  post.hasLiked = !!userLike; // double bang converts object/null to boolean true/false

  res.status(200).json({ success: true, data: post });
});

export const updatePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  if (post.author.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("User not authorized to update the post");
  }

  const validateData = postSchema.parse(req.body);
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    validateData,
    {
      new: true,
    },
  );
  res.status(200).json({ success: true, data: updatedPost });
});

export const deletePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (
    post.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("User not authorized to delete the post");
  }
  await post.deleteOne();
  res
    .status(200)
    .json({ success: true, data: { message: "Post deleted sucessfully" } });
});
