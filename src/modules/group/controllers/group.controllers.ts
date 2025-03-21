import { Response } from "express";
import GroupModel from "../models/group.model.ts";
import { handleError } from "../../../utils/errorHandler.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import GroupMemberModel from "../../groupMembers/model/groupMember.model.ts";
// import redisClient from "../../../config/redis.config.ts";

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

    // ✅ Invalidate Redis cache for group list
    // await redisClient.del(`groups:${orgId}:${createdBy}`);

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

    const userId = req.user._id;
    const cacheKey = `groups:${activeOrg}:${userId}`;

    // ✅ Check Redis cache first
    // const cachedGroups = await redisClient.get(cacheKey);
    // if (cachedGroups) {
    //   res.status(200).json({ groups: JSON.parse(cachedGroups) });
    //   return;
    // }

    // ✅ Fetch all group IDs where the user is a member
    const userGroupMemberships = await GroupMemberModel.find({ userId }).select(
      "groupId"
    );
    const userGroups = userGroupMemberships.map(
      (membership) => membership.groupId
    );

    // ✅ Fetch groups where the user is a member OR the group is public
    const groups = await GroupModel.find({
      orgId: activeOrg,
      $or: [{ _id: { $in: userGroups } }, { isPrivate: false }], // ✅ Show user's groups & public groups
    });

    // ✅ Store in Redis (cache expires in 10 minutes)
    // await redisClient.setEx(cacheKey, 600, JSON.stringify(groups));

    res.status(200).json({ groups });
  } catch (error) {
    handleError(res, error);
  }
};

export const getGroupById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Fetch group details
    const group = await GroupModel.findById(id)
      .populate("createdBy", "name email") // Include creator details
      .populate("orgId", "name") // Include organization details
      .lean();

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // Get actual member count from GroupMember collection
    const membersCount = await GroupMemberModel.countDocuments({ groupId: id });

    // Return group details with correct members count
    res.json({ ...group, membersCount });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroupInfo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId, name, description } = req.body;

    // Validate required fields
    if (!groupId) {
      res.status(400).json({ message: "groupId is required." });
      return;
    }

    // Check if the group exists
    const existingGroup = await GroupModel.findById(groupId);
    if (!existingGroup) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // If updating the name, check if it's already taken
    if (name && name !== existingGroup.name) {
      const nameExists = await GroupModel.findOne({ name });
      if (nameExists) {
        res.status(400).json({ message: "Group name already exists." });
        return;
      }
    }

    // Update the group
    const updatedGroup = await GroupModel.findByIdAndUpdate(
      groupId,
      { $set: { ...(name && { name }), ...(description && { description }) } },
      { new: true, runValidators: true }
    ).lean();

    res.json({ message: "Group updated successfully", group: updatedGroup });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: "Server error" });
  }
};
