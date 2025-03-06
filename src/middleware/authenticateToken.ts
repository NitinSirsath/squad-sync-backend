import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

// ✅ Extend Express Request Type Globally
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: mongoose.Types.ObjectId;
      email: string;
      role: "admin" | "manager" | "employee";
      orgId: mongoose.Types.ObjectId; // ✅ Ensure `orgId` is also an ObjectId
    };
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Unauthorized: Token missing" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.user) {
      res.status(401).json({ error: "Invalid Token" });
      return;
    }

    // ✅ Convert id & orgId to `mongoose.Types.ObjectId` to match MongoDB models
    req.user = {
      id: new mongoose.Types.ObjectId(decoded.user._id),
      email: decoded.user.email,
      role: decoded.user.role,
      orgId: new mongoose.Types.ObjectId(decoded.user.orgId),
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
