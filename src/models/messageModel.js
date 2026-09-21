import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: false,
    },
  },
  { timestamps: true },
);

// Optimize querying messages by conversation and sorting by time
messageSchema.index({ conversationId: 1, createdAt: -1 });
export default mongoose.model("Message", messageSchema);
