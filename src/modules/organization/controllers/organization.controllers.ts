import { Request, Response } from "express";
import OrganizationModel from "../../../models/organization/organization.model.ts";
import UserModel, {
  OrganizationMembership,
  User,
} from "../../../models/user/userModels.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import jwt, { JwtPayload } from "jsonwebtoken";
import { handleError } from "../../../utils/errorHandler.ts";

export const createOrganization = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { organizationName, industry } = req.body;

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

    // ✅ Fetch the full user from DB (to get organizations)
    const user: User | null = await UserModel.findById(decoded.user._id).lean();

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const userId = user?._id; // ✅ Authenticated User

    if (!organizationName) {
      res.status(400).json({ error: "Organization name is required" });
      return;
    }

    // ✅ Create Organization with a single admin
    const newOrg = await OrganizationModel.create({
      name: organizationName,
      admin: userId, // ✅ Single Admin
      members: [userId], // ✅ Admin is first member
      industry: industry || "",
    });

    // ✅ Update User's Organization List & Set Active Org
    await UserModel.findByIdAndUpdate(userId, {
      $push: { organizations: { orgId: newOrg._id, role: "admin" } },
      activeOrg: newOrg._id, // ✅ Set Active Organization
    });

    res.status(201).json({
      message: "Organization created successfully",
      organization: {
        _id: newOrg._id,
        name: newOrg.name,
        industry: newOrg.industry,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const switchOrganization = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orgId } = req.body;
    const userId = req.user?._id;

    // ✅ Ensure the user belongs to this organization
    const user = await UserModel.findOne({
      _id: userId,
      "organizations.orgId": orgId,
    });

    if (!user) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // ✅ Store active org in session/local storage (Frontend)
    res.status(200).json({
      message: "Switched organization successfully",
      activeOrg: orgId,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserOrganizations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;

    const user = await UserModel.findById(userId).populate(
      "organizations.orgId",
      "name industry"
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ organizations: user.organizations });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
