import { Response } from "express";
import DirectMessageModel from "../models/directMessage.model.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import UserModel from "../../../models/user/userModels.ts";
import redisClient from "../../../config/redis.config.ts"; // ✅ Import Redis client
import { handleError } from "../../../utils/errorHandler.ts";
import mongoose from "mongoose";

export const markDirectMessagesAsSeen = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { senderId } = req.body; // ✅ Mark all messages from sender as seen
    const receiverId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      res.status(400).json({ error: "Invalid senderId format" });
      return;
    }

    // ✅ Update seen status for all unread messages
    await DirectMessageModel.updateMany(
      { senderId, receiverId, seen: false },
      { seen: true }
    );

    // ✅ Invalidate Redis cache
    const cacheKey = `directMessages:${receiverId}:${senderId}`;
    await redisClient.del(cacheKey);

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    handleError(res, error);
  }
};

export const sendDirectMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { receiverId, message, messageType, fileUrl } = req.body;
    const senderId = req.user._id;
    const senderName = `${req.user.firstName} ${req.user.lastName}`;
    const activeOrg = req.user.activeOrg;

    if (!receiverId || !message) {
      res.status(400).json({ error: "Receiver ID and message are required" });
      return;
    }

    // ✅ Fetch receiver details
    const receiver = await UserModel.findById(receiverId).lean();
    if (!receiver) {
      res.status(404).json({ error: "Receiver not found" });
      return;
    }

    // ✅ Ensure receiver is in the same organization
    const isSameOrganization = receiver.organizations.some(
      (org) => org.orgId.toString() === activeOrg.toString()
    );

    if (!isSameOrganization) {
      res.status(403).json({
        error: "Cannot message users outside your organization",
        rec: receiver.organizations,
        activeOrg,
      });
      return;
    }

    // ✅ Save message in database
    const newMessage = await DirectMessageModel.create({
      senderId,
      senderName,
      receiverId,
      receiverName: `${receiver.firstName} ${receiver.lastName}`,
      message,
      messageType: messageType || "text",
      fileUrl: fileUrl || null,
      seen: false,
    });

    // ✅ Invalidate Redis cache for both sender and receiver
    const senderCacheKey = `directMessages:${senderId}:${receiverId}`;
    const receiverCacheKey = `directMessages:${receiverId}:${senderId}`;
    await redisClient.del(senderCacheKey);
    await redisClient.del(receiverCacheKey);

    res.status(201).json({ message: "Message sent", newMessage });
  } catch (error) {
    handleError(res, error);
  }
};

export const getDirectMessages = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { userId } = req.params;
    const currentUserId = req.user._id;
    const cacheKey = `directMessages:${currentUserId}:${userId}`;

    // ✅ Check Redis cache first
    const cachedMessages = await redisClient.get(cacheKey);
    if (cachedMessages) {
      res.status(200).json({ messages: JSON.parse(cachedMessages) });
      return;
    }

    // ✅ Fetch messages from MongoDB if not cached
    const messages = await DirectMessageModel.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // ✅ Store in Redis (cache expires in 10 minutes)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(messages));

    res.status(200).json({ messages });
  } catch (error) {
    handleError(res, error);
  }
};

export const getChatList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.user._id;
    const cacheKey = `chatList:${userId}`;

    // ✅ Check Redis cache first
    const cachedChatList = await redisClient.get(cacheKey);
    if (cachedChatList) {
      console.log("📌 Returning cached chat list");
      res.status(200).json({ chatList: JSON.parse(cachedChatList) });
      return;
    }

    // ✅ Fetch latest message per unique chat
    const chatList = await DirectMessageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            chatWith: {
              $cond: [
                { $eq: ["$senderId", userId] },
                "$receiverId",
                "$senderId",
              ],
            },
          },
          lastMessage: { $first: "$message" },
          lastMessageType: { $first: "$messageType" },
          lastMessageTime: { $first: "$createdAt" },
          unseenCount: {
            $sum: {
              $cond: [{ $eq: ["$seen", false] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.chatWith",
          foreignField: "_id",
          as: "chatUser",
        },
      },
      {
        $unwind: "$chatUser",
      },
      {
        $project: {
          chatWith: "$chatUser._id",
          name: { $concat: ["$chatUser.firstName", " ", "$chatUser.lastName"] },
          email: "$chatUser.email",
          profilePicture: "$chatUser.profilePicture",
          lastMessage: 1,
          lastMessageType: 1,
          lastMessageTime: 1,
          unseenCount: 1,
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    // ✅ Store result in Redis (expires in 5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(chatList));

    res.status(200).json({ chatList });
    return;
  } catch (error) {
    handleError(res, error);
  }
};
