import { Request, Response } from "express";
import mongoose from "mongoose"; // ✅ Import mongoose for ObjectId validation
import MessageModel from "../models/message.model.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import { handleError } from "../../../utils/errorHandler.ts";

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    let { page = "1", limit = "20" } = req.query; // Default page: 1, Default limit: 20 messages

    // Convert page & limit to numbers
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // ✅ Validate groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({ error: "Invalid groupId format" });
      return;
    }

    const messages = await MessageModel.find({ groupId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum) // ✅ Pagination: Skip messages based on page
      .limit(limitNum);

    res.status(200).json({ page: pageNum, messages });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { groupId, message, messageType, fileUrl } = req.body;
    const senderId = req.user.id;

    if (!groupId || !message) {
      res.status(400).json({ error: "Group ID and message are required" });
      return;
    }

    const newMessage = await MessageModel.create({
      groupId,
      senderId,
      message,
      messageType: messageType || "text",
      fileUrl: fileUrl || null,
    });

    res.status(201).json({ message: "Message sent successfully", newMessage });
  } catch (error) {
    handleError(res, error);
  }
};
