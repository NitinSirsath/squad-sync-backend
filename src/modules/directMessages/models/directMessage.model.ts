import mongoose, { Schema, Document } from "mongoose";

interface DirectMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  receiverId: mongoose.Types.ObjectId;
  receiverName: string;
  message: string;
  messageType: "text" | "file";
  fileUrl?: string;
  seen: boolean; // ✅ Tracks if the message is read
  createdAt: Date;
}

const DirectMessageSchema = new Schema<DirectMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true }, // ✅ Store sender name
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverName: { type: String, required: true }, // ✅ Store receiver name
    message: { type: String, required: true },
    messageType: { type: String, enum: ["text", "file"], default: "text" },
    fileUrl: { type: String, default: null },
    seen: { type: Boolean, default: false }, // ✅ Track read status
  },
  { timestamps: true }
);

// ✅ Indexing for better query performance
DirectMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const DirectMessageModel = mongoose.model<DirectMessage>(
  "DirectMessage",
  DirectMessageSchema
);
export default DirectMessageModel;
