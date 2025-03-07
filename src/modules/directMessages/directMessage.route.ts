import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  getDirectMessages,
  sendDirectMessage,
} from "./controllers/directMessage.controllers.ts";

const directMessageRoutes = express.Router();

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

export { directMessageRoutes };
