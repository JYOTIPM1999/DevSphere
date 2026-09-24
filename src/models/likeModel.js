import mongoose from "mongoose";

const likeSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true },
);
// COMPOUND INDEX: Ensures a user can only have one like document per post
likeSchema.index({ user: 1, post: 1 }, { unique: true });
// Optimizes the $lookup stage where we join likes by post ID
likeSchema.index({ post: 1 });

export default mongoose.model("Like", likeSchema);
