import mongoose, { Schema, Document } from "mongoose";
import { UserType } from "../../types/user.types.ts";

const userCollectionSchema = new Schema<UserType & Document>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true }, // ✅ Unique but allows null
    password: { type: String, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    profilePicture: { type: String, default: "" },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true }, // ✅ Fix ObjectId type
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }, // ✅ Track who created user
  },
  { timestamps: true }
);

// ✅ Indexes for better performance
userCollectionSchema.index({ email: 1 }, { unique: true, sparse: true }); // ✅ Allow multiple null values
userCollectionSchema.index({ username: 1 }, { unique: true }); // ✅ Always unique
userCollectionSchema.index({ orgId: 1 }); // ✅ Optimize organization queries

const userCollection = mongoose.model<UserType & Document>(
  "User",
  userCollectionSchema
);

export default userCollection;
