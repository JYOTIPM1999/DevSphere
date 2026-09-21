import mongoose from "mongoose";

const conversationSchema = mongoose.Schema(
  {
    name: { type: String, trim: true },
    isGroup: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        lastRead: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true },
);

export default mongoose.model("Conversation", conversationSchema);
