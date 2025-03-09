import { Request, Response } from "express";
import mongoose from "mongoose"; // ✅ Import mongoose for ObjectId validation
import MessageModel from "../models/groupMessage.model.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import { handleError } from "../../../utils/errorHandler.ts";
import redisClient from "../../../config/redis.config.ts";
import GroupMemberModel from "../../groupMembers/model/groupMember.model.ts";

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

    const cacheKey = `group:${groupId}:messages:page:${pageNum}`;

    // ✅ Check Redis cache
    const cachedMessages = await redisClient.get(cacheKey);
    if (cachedMessages) {
      console.log("Cached messages");
      res
        .status(200)
        .json({ page: pageNum, messages: JSON.parse(cachedMessages) });
      return;
    }

    // ✅ Fetch from MongoDB
    const messages = await MessageModel.find({ groupId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // ✅ Store result in Redis (expires in 5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(messages)); // 300 seconds (5 min)
    console.log("Fetched messages from MongoDB");

    res.status(200).json({ page: pageNum, messages });
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
    const keys = await redisClient.keys(`group:${groupId}:messages:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

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
    const keys = await redisClient.keys(`group:${groupId}:messages:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    handleError(res, error);
  }
};
