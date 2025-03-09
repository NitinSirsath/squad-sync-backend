import mongoose, { Document, Schema } from "mongoose";

export interface IGroup extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId; // ✅ Added: Organization ID
  membersCount: number;
  isPrivate: boolean;
  groupIcon?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true }, // ✅ Ensure groups belong to an org
    membersCount: { type: Number, default: 1 },
    isPrivate: { type: Boolean, default: false },
    groupIcon: { type: String, default: "" },
    category: { type: String, default: "General" },
  },
  { timestamps: true }
);

GroupSchema.index({ orgId: 1 }); // ✅ Index for fast org-based lookups

const GroupModel = mongoose.model<IGroup>("Group", GroupSchema);

export default GroupModel;
