import mongoose from "mongoose";

export type UserType = {
  username: string;
  email?: string; // ✅ Optional email
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  role: "admin" | "manager" | "employee"; // ✅ Role-based access
  orgId: mongoose.Types.ObjectId; // ✅ Links user to organization
  createdBy?: mongoose.Types.ObjectId; // ✅ Tracks who created the user
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
};
