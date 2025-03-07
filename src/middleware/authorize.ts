import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/authRequest.types.ts";

export const authorize =
  (allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user || !allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    next(); // ✅ Ensure the middleware always calls next()
  };
