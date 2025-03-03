import mongoose from "mongoose";

const userCollectionSchema = new mongoose.Schema(
  {
    username: { type: String, require: true, unique: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: Number },
  },
  { timestamps: true }
);

const userCollection = mongoose.model("User", userCollectionSchema);

export default userCollection;
