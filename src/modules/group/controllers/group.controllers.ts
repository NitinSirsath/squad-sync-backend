import { Response } from "express";
import GroupModel, { IGroup } from "../models/group.model.ts";
import { handleError } from "../../../utils/errorHandler.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import GroupMemberModel from "../../groupMembers/model/groupMember.model.ts";

export const createGroup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { name, description, isPrivate, groupIcon, category }: IGroup =
      req.body;
    const userId = req.user._id;

    // Check if group name already exists
    const existingGroup = await GroupModel.findOne({ name });
    if (existingGroup) {
      res.status(400).json({ error: "Group name already taken" });
      return;
    }

    // Create new group
    const group = new GroupModel({
      name,
      description,
      createdBy: userId,
      isPrivate,
      groupIcon,
      category,
    });
    await group.save();

    // Add creator as admin in GroupMembers table
    await GroupMemberModel.create({
      groupId: group._id,
      userId,
      role: "admin",
    });

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAllGroups = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const groups = await GroupModel.find();
    res.status(200).json({ groups });
  } catch (error) {
    handleError(res, error);
  }
};
