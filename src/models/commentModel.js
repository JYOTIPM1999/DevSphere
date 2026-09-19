import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, trim: true, maxLength: 500 },
  },
  { timestamps: true },
);

export default mongoose.model("Comment", commentSchema);
