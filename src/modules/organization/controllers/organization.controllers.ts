import { Response } from "express";
import UserModel, { User } from "../../../models/user/userModels.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import jwt, { JwtPayload } from "jsonwebtoken";
import { handleError } from "../../../utils/errorHandler.ts";
import OrganizationModel from "../models/organization.model.ts";
import redisClient from "../../../config/redis.config.ts";

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

    const userId = user?._id; // ✅ Authenticated User

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    if (!organizationName) {
      res.status(400).json({ error: "Organization name is required" });
      return;
    }

    // ✅ Ensure user does not already own another organization
    const existingOrg = await OrganizationModel.findOne({ admin: userId });

    if (existingOrg) {
      res.status(400).json({ error: "You already own an organization." });
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

    await redisClient.setEx(
      `organization:${newOrg._id}`,
      6000,
      JSON.stringify(newOrg)
    );

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
    handleError(res, error);
  }
};

export const getUserOrganizations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const cacheKey = `user:${userId}:organizations`;
    const cachedOrgs = await redisClient.get(cacheKey);
    if (cachedOrgs) {
      res.status(200).json({ organizations: JSON.parse(cachedOrgs) });
      return;
    }
    const user = await UserModel.findById(userId).populate(
      "organizations.orgId",
      "name industry"
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await redisClient.setEx(cacheKey, 600, JSON.stringify(user.organizations));
    res.status(200).json({ organizations: user.organizations });
  } catch (error) {
    handleError(res, error);
  }
};

export const getOrganizationMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const activeOrg = req.user.activeOrg;
    if (!activeOrg) {
      res.status(400).json({ error: "No active organization selected" });
      return;
    }

    // ✅ Check Redis cache first
    const cacheKey = `organization:${activeOrg}:members`;
    const cachedMembers = await redisClient.get(cacheKey);
    if (cachedMembers) {
      res.status(200).json({ members: JSON.parse(cachedMembers) });
      return;
    }

    // ✅ Fetch users who belong to the active organization
    const members = await UserModel.find(
      { "organizations.orgId": activeOrg },
      "-password"
    ).lean();

    // ✅ Cache the results for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(members));

    res.status(200).json({ members });
  } catch (error) {
    handleError(res, error);
  }
};
