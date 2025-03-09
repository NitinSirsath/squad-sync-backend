import mongoose from "mongoose";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    email: string;
    firstName: string; // ✅ Added First Name
    lastName: string; // ✅ Added Last Name
    profilePicture?: string; // ✅ Optional Profile Picture
    organizations: { orgId: mongoose.Types.ObjectId; role: string }[];
    activeOrg: mongoose.Types.ObjectId;
  };
}
