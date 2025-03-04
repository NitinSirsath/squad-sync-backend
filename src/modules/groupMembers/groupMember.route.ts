import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupMembers,
} from "./controllers/groupMember.controllers.ts";

const groupMemberRoutes = express.Router();

groupMemberRoutes.post("/add", authenticateToken, addMemberToGroup);
groupMemberRoutes.post("/remove", authenticateToken, removeMemberFromGroup);
groupMemberRoutes.get("/:groupId/members", authenticateToken, getGroupMembers);

export default groupMemberRoutes;
