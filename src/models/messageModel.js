import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: false,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index for faster query performance when fetching chat history between two users
messageSchema.index({ sender: 1, receiver: 1 });
export default mongoose.model("Message", messageSchema);
