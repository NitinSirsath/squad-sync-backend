import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/authRequest.types.ts";

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const activeOrgDetails = req.user.organizations.find(
      (org) =>
        req.user && org.orgId.toString() === req.user.activeOrg.toString()
    );

    if (!activeOrgDetails || !allowedRoles.includes(activeOrgDetails.role)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    next();
  };
};
