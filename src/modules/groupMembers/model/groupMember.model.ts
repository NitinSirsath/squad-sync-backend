import mongoose, { Schema } from "mongoose";
import { IGroupMember } from "../controllers/groupMember.controllers.ts";

// Define Group Member Schema
const GroupMemberSchema = new Schema<IGroupMember>({
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["admin", "member", "guest"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
});

// Add Index for Faster Queries
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

const GroupMemberModel = mongoose.model<IGroupMember>(
  "GroupMember",
  GroupMemberSchema
);

export default GroupMemberModel;
