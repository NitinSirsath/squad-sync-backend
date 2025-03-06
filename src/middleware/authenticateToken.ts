import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types/authRequest.types.ts";

export const authenticateToken = (
  req: Request, // ✅ Keep `Request` type here
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

    // ✅ Convert `id` and `orgId` to `mongoose.Types.ObjectId`
    (req as AuthenticatedRequest).user = {
      id: new mongoose.Types.ObjectId(decoded.user._id),
      email: decoded.user.email,
      role: decoded.user.role,
      orgId: new mongoose.Types.ObjectId(decoded.user.orgId), // ✅ Ensure `orgId` is assigned
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
