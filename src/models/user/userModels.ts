import mongoose, { Schema, Document } from "mongoose";
import { UserType } from "../../types/user.types.ts";

const userCollectionSchema = new Schema<UserType & Document>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    password: { type: String, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    profilePicture: { type: String, default: "" },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null }, // ✅ Fix: Default to null
  },
  { timestamps: true }
);

// ✅ Indexes for performance
userCollectionSchema.index({ email: 1 }, { unique: true, sparse: true });
userCollectionSchema.index({ username: 1 }, { unique: true });
userCollectionSchema.index({ orgId: 1 });

const userCollection = mongoose.model<UserType & Document>(
  "User",
  userCollectionSchema
);

export default userCollection;
