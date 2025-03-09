import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import { authorize } from "../../middleware/authorize.ts";
import {
  createOrganization,
  getOrganizationMembers,
  getUserOrganizations,
  switchOrganization,
} from "./controllers/organization.controllers.ts";

const organizationRoutes = express.Router();

// ✅ Create a new organization (Only Authenticated Users)
organizationRoutes.post("/create", createOrganization);

// ✅ Get all organizations a user belongs to
organizationRoutes.get(
  "/user-organizations",
  authenticateToken,
  getUserOrganizations
);

// ✅ Switch active organization
organizationRoutes.post(
  "/switch-organization",
  authenticateToken,
  switchOrganization
);
organizationRoutes.get(
  "/organization-members",
  authenticateToken,
  getOrganizationMembers
);

export default organizationRoutes;
