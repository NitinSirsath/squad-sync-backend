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

    // ✅ Fetch user from DB (to get organizations)
    const user: User | null = await UserModel.findById(decoded.user._id).lean();

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // ✅ Assign organizations
    const organizations = user.organizations || [];

    // ✅ Handle activeOrg assignment (fallback to first org)
    let activeOrg: mongoose.Types.ObjectId | null = null;
    if (user.activeOrg && mongoose.Types.ObjectId.isValid(user.activeOrg)) {
      activeOrg = new mongoose.Types.ObjectId(user.activeOrg);
    } else if (organizations.length > 0) {
      activeOrg = new mongoose.Types.ObjectId(organizations[0].orgId);
    }

    // ✅ Authentication passed but no organization selected
    if (!activeOrg) {
      res.status(400).json({ error: "No active organization selected" });
      return;
    }

    // ✅ Assign user details to `req.user`
    (req as AuthenticatedRequest).user = {
      _id: new mongoose.Types.ObjectId(user._id),
      email: user.email,
      organizations,
      activeOrg,
    };

    next(); // ✅ Proceed to the next middleware or controller
  } catch (error) {
    handleError(res, error);
  }
};
