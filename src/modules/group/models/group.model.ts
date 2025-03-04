import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  description?: string; // Optional
  createdBy: mongoose.Types.ObjectId; // Reference to User
  membersCount: number;
  isPrivate: boolean;
  groupIcon?: string; // Optional group profile picture
  category?: string; // e.g., "Development", "Marketing"
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    membersCount: { type: Number, default: 1 }, // Auto-increment when members are added
    isPrivate: { type: Boolean, default: false }, // Public by default
    groupIcon: { type: String, default: "" },
    category: { type: String, default: "General" }, // Default category
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

const GroupModel = mongoose.model<IGroup>("Group", GroupSchema);

export default GroupModel;
