import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  getChatList,
  getDirectMessages,
  markDirectMessagesAsSeen,
  sendDirectMessage,
} from "./controllers/directMessage.controllers.ts";

const directMessageRoutes = express.Router();

directMessageRoutes.post(
  "/mark-seen",
  authenticateToken,
  markDirectMessagesAsSeen
);
directMessageRoutes.post(
  "/send-direct-message",
  authenticateToken,
  sendDirectMessage
);
directMessageRoutes.get(
  "/:userId/messages",
  authenticateToken,
  getDirectMessages
);

directMessageRoutes.get("/chat-list", authenticateToken, getChatList);

export { directMessageRoutes };
