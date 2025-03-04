import mongoose, { Document, Schema } from "mongoose";

export interface IGroup extends Document {
  name: string; // Group Name
  description?: string; // Optional: Group Description
  createdBy: mongoose.Types.ObjectId; // Reference to User who created the group
  membersCount: number; // Keeps track of number of members
  isPrivate: boolean; // True = Private, False = Public
  groupIcon?: string; // Optional: URL for Group Icon
  category?: string; // e.g., "Development", "Marketing", etc.
  createdAt: Date;
  updatedAt: Date;
}

// Define Group Schema
const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    membersCount: { type: Number, default: 1 }, // Default to 1 (creator)
    isPrivate: { type: Boolean, default: false }, // Public by default
    groupIcon: { type: String, default: "" },
    category: { type: String, default: "General" }, // Default category
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

// Create Group Model
const GroupModel = mongoose.model<IGroup>("Group", GroupSchema);

export default GroupModel;
