import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Post Content is required"],
      trim: true,
      maxLength: [1000, "Post content can't exceed 1000 characters"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);
// Optimizes grouping by date and searching by author
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
export default mongoose.model("Post", postSchema);
