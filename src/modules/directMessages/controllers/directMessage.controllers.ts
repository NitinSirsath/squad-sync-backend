import { Request, Response } from "express";
import DirectMessageModel from "../models/directMessage.model.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";

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
    const senderId = req.user.id;

    if (!receiverId || !message) {
      res.status(400).json({ error: "Receiver ID and message are required" });
      return;
    }

    // ✅ Save message in database
    const newMessage = await DirectMessageModel.create({
      senderId,
      receiverId,
      message,
      messageType: messageType || "text",
      fileUrl: fileUrl || null,
    });

    res.status(201).json({ message: "Message sent", newMessage });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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
    const currentUserId = req.user.id;

    const messages = await DirectMessageModel.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50); // Fetch latest 50 messages

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
