import { Request } from "express";
import mongoose from "mongoose";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: mongoose.Types.ObjectId;
    email: string;
    role: "admin" | "manager" | "employee";
    orgId: mongoose.Types.ObjectId; // ✅ Ensure `orgId` exists
  };
}
