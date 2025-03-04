import mongoose, { Schema } from "mongoose";
import { UserType } from "../../types/user.types.ts";

const userCollectionSchema = new Schema<UserType>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    profilePicture: { type: String, default: "" }, // Optional
    role: {
      type: String,
      enum: ["admin", "member", "guest"],
      default: "member",
    },
  },
  { timestamps: true }
);

// Indexes for better performance
userCollectionSchema.index({ email: 1 });
userCollectionSchema.index({ username: 1 });

const userCollection = mongoose.model("User", userCollectionSchema);

export default userCollection;
