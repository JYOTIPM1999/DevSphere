import Post from "../models/postModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { postSchema } from "../utils/postValidator.js";

export const createPost = catchAsync(async (req, res) => {
  const validatePost = postSchema.parse(req.body);
  const post = await Post.create({
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

export const getPost = catchAsync(async (req, res) => {
  console.log(req.params.id);
  const post = await Post.findById(req.params.id).populate(
    "author",
    "name avatar",
  );
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
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
