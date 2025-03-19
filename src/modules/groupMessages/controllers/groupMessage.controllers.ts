import { Request, Response } from "express";
import mongoose from "mongoose"; // ✅ Import mongoose for ObjectId validation
import MessageModel from "../models/groupMessage.model.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import { handleError } from "../../../utils/errorHandler.ts";
// import redisClient from "../../../config/redis.config.ts";
import GroupMemberModel from "../../groupMembers/model/groupMember.model.ts";
import UserModel from "../../../models/user/userModels.ts";

export const getGroupMessages = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { groupId } = req.params;
    let { page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50); // ✅ Max limit 50 messages

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({ error: "Invalid groupId format" });
      return;
    }

    const userId = req.user._id;

    // ✅ Check if the user is a group member
    const isMember = await GroupMemberModel.exists({ groupId, userId });
    if (!isMember) {
      res.status(403).json({ error: "Access denied: Not a group member" });
      return;
    }

    // ✅ Fetch messages and populate sender info
    const messages = await MessageModel.find({ groupId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(); // Convert Mongoose documents to plain objects for better performance

    // ✅ Fetch sender details separately from `UserModel`
    const senderIds = [
      ...new Set(messages.map((msg) => msg.senderId.toString())),
    ]; // Unique sender IDs
    const senders = await UserModel.find(
      { _id: { $in: senderIds } },
      "firstName lastName profilePicture"
    ).lean();

    // ✅ Create a sender map for quick lookup
    const senderMap = senders.reduce((acc, sender) => {
      acc[sender._id.toString()] = {
        senderName: `${sender.firstName} ${sender.lastName}`,
        profilePicture: sender.profilePicture || null,
      };
      return acc;
    }, {} as Record<string, { senderName: string; profilePicture: string | null }>);

    // ✅ Format messages with sender details
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id,
      groupId: msg.groupId,
      senderId: msg.senderId,
      senderName:
        senderMap[msg.senderId.toString()]?.senderName || "Unknown User",
      profilePicture:
        senderMap[msg.senderId.toString()]?.profilePicture || null,
      message: msg.message,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl || null,
      createdAt: msg.createdAt,
      // updatedAt: msg.updatedAt,
    }));

    res.status(200).json({ page: pageNum, messages: formattedMessages });
  } catch (error) {
    handleError(res, error);
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { groupId, message, messageType, fileUrl } = req.body;
    const senderId = req.user._id;

    if (!groupId || !message) {
      res.status(400).json({ error: "Group ID and message are required" });
      return;
    }

    // ✅ Check if sender is a member of the group
    const isMember = await GroupMemberModel.exists({
      groupId,
      userId: senderId,
    });
    if (!isMember) {
      res.status(403).json({ error: "Access denied: Not a group member" });
      return;
    }

    const newMessage = await MessageModel.create({
      groupId,
      senderId,
      message,
      messageType: messageType || "text",
      fileUrl: fileUrl || null,
    });

    // ✅ Invalidate all pages of messages for this group
    // const keys = await redisClient.keys(`group:${groupId}:messages:*`);
    // if (keys.length > 0) {
    //   await redisClient.del(keys);
    // }

    res.status(201).json({ message: "Message sent successfully", newMessage });
  } catch (error) {
    handleError(res, error);
  }
};

export const markGroupMessagesAsSeen = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { groupId } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({ error: "Invalid groupId format" });
      return;
    }

    // ✅ Check if user is a group member
    const isMember = await GroupMemberModel.exists({ groupId, userId });
    if (!isMember) {
      res.status(403).json({ error: "Access denied: Not a group member" });
      return;
    }

    // ✅ Update seen status for all unread messages
    await MessageModel.updateMany(
      { groupId, senderId: { $ne: userId }, seenBy: { $ne: userId } },
      { $addToSet: { seenBy: userId } }
    );

    // ✅ Invalidate Redis cache
    // const keys = await redisClient.keys(`group:${groupId}:messages:*`);
    // if (keys.length > 0) {
    //   await redisClient.del(keys);
    // }

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    handleError(res, error);
  }
};
