import mongoose from "mongoose";

export type UserType = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  role: "admin" | "member" | "guest";
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
};
