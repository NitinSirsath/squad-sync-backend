import { Response } from "express";
import GroupModel, { IGroup } from "../models/group.model.ts";
import { handleError } from "../../../utils/errorHandler.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import GroupMemberModel from "../../groupMembers/model/groupMember.model.ts";

export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { name, description, isPrivate, category } = req.body;
    const createdBy = req.user._id;
    const orgId = req.user.activeOrg; // ✅ Link group to the active organization

    if (!orgId) {
      res.status(400).json({ error: "No active organization selected" });
      return;
    }

    // ✅ Ensure group name is unique within the organization
    const existingGroup = await GroupModel.findOne({ name, orgId });
    if (existingGroup) {
      res
        .status(400)
        .json({ error: "Group name already exists in this organization" });
      return;
    }

    // ✅ Create Group
    const newGroup = await GroupModel.create({
      name,
      description,
      createdBy,
      orgId, // ✅ Store orgId
      isPrivate: isPrivate || false,
      category: category || "General",
      membersCount: 1,
    });

    // ✅ Auto-add creator as "admin" in GroupMemberModel
    await GroupMemberModel.create({
      groupId: newGroup._id,
      userId: createdBy,
      role: "admin",
    });

    res.status(201).json({
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAllGroups = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const activeOrg = req.user.activeOrg; // ✅ Get active organization

    if (!activeOrg) {
      res.status(400).json({ error: "No active organization selected" });
      return;
    }

    // ✅ Fetch only groups that belong to the active organization
    const groups = await GroupModel.find({ orgId: activeOrg });

    res.status(200).json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
