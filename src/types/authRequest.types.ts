import mongoose from "mongoose";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    email: string;
    organizations: { orgId: mongoose.Types.ObjectId; role: string }[];
    activeOrg: mongoose.Types.ObjectId;
  };
}
