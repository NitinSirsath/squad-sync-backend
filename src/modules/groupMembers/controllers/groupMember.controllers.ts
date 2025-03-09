import { Response } from "express";
import GroupMemberModel from "../model/groupMember.model.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";

// 🔹 API: Add a Member to a Group
export const addMemberToGroup = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId, userId, role } = req.body;
    const adminId = req.user?._id; // Authenticated admin

    // Check if the user is an admin
    const admin = await GroupMemberModel.findOne({
      groupId,
      userId: adminId,
      role: "admin",
    });
    if (!admin) {
      res.status(403).json({ error: "Only group admins can add members" });
      return;
    }

    // Check if user is already in the group
    const existingMember = await GroupMemberModel.findOne({ groupId, userId });
    if (existingMember) {
      res.status(400).json({ error: "User is already in the group" });
      return;
    }

    // Add new member
    const newMember = new GroupMemberModel({ groupId, userId, role });
    await newMember.save();

    res.status(201).json({ message: "User added to group", newMember });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔹 API: Remove a Member from a Group
export const removeMemberFromGroup = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId, userId } = req.body;
    const adminId = req.user?._id;

    // Check if the requester is an admin
    const admin = await GroupMemberModel.findOne({
      groupId,
      userId: adminId,
      role: "admin",
    });
    if (!admin) {
      res.status(403).json({ error: "Only group admins can remove members" });
      return;
    }

    // Prevent self-removal
    if (userId === adminId) {
      res.status(400).json({ error: "Admin cannot remove themselves" });
      return;
    }

    // Remove member
    const removed = await GroupMemberModel.findOneAndDelete({
      groupId,
      userId,
    });
    if (!removed) {
      res.status(404).json({ error: "User not found in group" });
      return;
    }

    res.status(200).json({ message: "User removed from group" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔹 API: Get All Members of a Group
export const getGroupMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;

    const members = await GroupMemberModel.find({ groupId })
      .populate("userId", "username email profilePicture role")
      .select("role joinedAt");

    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
