import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroupInfo,
} from "./controllers/group.controllers.ts";

const groupRoutes = express.Router();

groupRoutes.post("/create-group", authenticateToken, createGroup);
groupRoutes.get("/get-groups", authenticateToken, getAllGroups);
groupRoutes.get("/delete-group", authenticateToken, getAllGroups);
groupRoutes.get("/:id", authenticateToken, getGroupById);
groupRoutes.post("/update-group", authenticateToken, updateGroupInfo);

export default groupRoutes;
