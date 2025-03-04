import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  getGroupMessages,
  sendMessage,
} from "./controllers/message.controllers.ts";

const messageRoutes = express.Router();

messageRoutes.get("/:groupId/messages", authenticateToken, getGroupMessages);
messageRoutes.post("/send-message", authenticateToken, sendMessage); // ✅ New Route

export default messageRoutes;
