import Post from "../models/postModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { postSchema } from "../utils/postValidator.js";

export const createPost = catchAsync(async (req, res) => {
  const validatePost = postSchema.parse(req.body);
  const post = Post.create({
    ...validatePost,
    author: req.user?._id,
  });
  res.status(201).json({ sucess: true, data: post });
});

export const getPosts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const posts = await Post.find()
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate("author", "name avatar");
  res.status(200).json({ success: true, data: posts });
});
