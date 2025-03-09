import { Response } from "express";
import GroupMemberModel from "../model/groupMember.model.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import redisClient from "../../../config/redis.config.ts";
import { handleError } from "../../../utils/errorHandler.ts";

// 🔹 API: Add a Member to a Group
export const addMemberToGroup = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId, userId, role } = req.body;
    const adminId = req.user?._id; // Authenticated admin

    // ✅ Check if the user is an admin
    const admin = await GroupMemberModel.findOne({
      groupId,
      userId: adminId,
      role: "admin",
    });
    if (!admin) {
      res.status(403).json({ error: "Only group admins can add members" });
      return;
    }

    // ✅ Check if user is already in the group
    const existingMember = await GroupMemberModel.findOne({ groupId, userId });
    if (existingMember) {
      res.status(400).json({ error: "User is already in the group" });
      return;
    }

    // ✅ Add new member
    const newMember = new GroupMemberModel({ groupId, userId, role });
    await newMember.save();

    // ✅ Invalidate Redis cache for group members
    await redisClient.del(`group:${groupId}:members`);

    res.status(201).json({ message: "User added to group", newMember });
  } catch (error) {
    handleError(res, error);
  }
};

// 🔹 API: Remove a Member from a Group
// 🔹 API: Remove a Member from a Group
export const removeMemberFromGroup = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId, userId } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
      res.status(401).json({ error: "Not authorized" });
      return;
    }

    // ✅ Check if requester is an admin
    const admin = await GroupMemberModel.findOne({
      groupId,
      userId: adminId,
      role: "admin",
    });
    if (!admin) {
      res.status(403).json({ error: "Only group admins can remove members" });
      return;
    }

    // ✅ Prevent self-removal
    if (userId === adminId.toString()) {
      res.status(400).json({ error: "Admin cannot remove themselves" });
      return;
    }

    // ✅ Remove member
    const removed = await GroupMemberModel.findOneAndDelete({
      groupId,
      userId,
    });
    if (!removed) {
      res.status(404).json({ error: "User not found in group" });
      return;
    }

    // ✅ Invalidate Redis cache for group members
    await redisClient.del(`group:${groupId}:members`);

    res.status(200).json({ message: "User removed from group" });
  } catch (error) {
    handleError(res, error);
  }
};

// 🔹 API: Get All Members of a Group
// 🔹 API: Get All Members of a Group
export const getGroupMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;
    const cacheKey = `group:${groupId}:members`;

    // ✅ Check Redis cache first
    const cachedMembers = await redisClient.get(cacheKey);
    if (cachedMembers) {
      res.status(200).json({ members: JSON.parse(cachedMembers) });
      return;
    }

    // ✅ Fetch from MongoDB if not cached
    const members = await GroupMemberModel.find({ groupId })
      .populate("userId", "username email profilePicture role")
      .select("role joinedAt");

    // ✅ Store in Redis (cache expires in 5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(members));

    res.status(200).json({ members });
  } catch (error) {
    handleError(res, error);
  }
};
