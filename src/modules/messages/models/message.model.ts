import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  message: string;
  messageType: "text" | "image" | "file";
  fileUrl?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

// ✅ Indexes to optimize message retrieval
MessageSchema.index({ groupId: 1, createdAt: -1 }); // Query messages by group, sorted by time
MessageSchema.index({ senderId: 1, createdAt: -1 }); // Query messages by sender

const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);

export default MessageModel;
