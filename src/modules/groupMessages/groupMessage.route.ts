import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  getGroupMessages,
  sendMessage,
} from "./controllers/groupMessage.controllers.ts";

const messageRoutes = express.Router();

messageRoutes.get(
  "/:groupId/group-messages",
  authenticateToken,
  getGroupMessages
);
messageRoutes.post("/send-message", authenticateToken, sendMessage); // ✅ New Route

export default messageRoutes;
