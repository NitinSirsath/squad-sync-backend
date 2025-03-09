import { NextFunction, Request, Response, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types/authRequest.types.ts";
import UserModel, { User } from "../models/user/userModels.ts";
import { handleError } from "../utils/errorHandler.ts";

export const authenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // ✅ Fetch user from DB
    const user: User | null = await UserModel.findById(decoded.user._id).lean();

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const organizations = user.organizations || [];

    let activeOrg: mongoose.Types.ObjectId | null = null;
    if (user.activeOrg && mongoose.Types.ObjectId.isValid(user.activeOrg)) {
      activeOrg = new mongoose.Types.ObjectId(user.activeOrg);
    } else if (organizations.length > 0) {
      activeOrg = new mongoose.Types.ObjectId(organizations[0].orgId);
    }

    if (!activeOrg) {
      res.status(404).json({ error: "Organization ID not found" });
      return;
    }

    // ✅ Assign user details, including `firstName` and `lastName`
    (req as AuthenticatedRequest).user = {
      _id: new mongoose.Types.ObjectId(user._id),
      email: user.email,
      firstName: user.firstName || "", // ✅ Ensure these fields exist
      lastName: user.lastName || "",
      profilePicture: user.profilePicture || "",
      organizations,
      activeOrg,
    };

    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
    return;
  }
};
