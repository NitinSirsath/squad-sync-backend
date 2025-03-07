import mongoose, { Schema, Document } from "mongoose";

interface DirectMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  messageType: "text" | "file";
  fileUrl?: string;
  createdAt: Date;
}

const DirectMessageSchema = new Schema<DirectMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    messageType: { type: String, enum: ["text", "file"], default: "text" },
    fileUrl: { type: String, default: null },
  },
  { timestamps: true }
);

// Indexing for better query performance
DirectMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const DirectMessageModel = mongoose.model<DirectMessage>(
  "DirectMessage",
  DirectMessageSchema
);
export default DirectMessageModel;
