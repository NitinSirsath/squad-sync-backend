import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import { createGroup, getAllGroups } from "./controllers/group.controllers.ts";

const groupRouter = express.Router();

groupRouter.post("/create-group", authenticateToken, createGroup);
groupRouter.get("/get-groups", authenticateToken, getAllGroups);
groupRouter.get("/delete-group", authenticateToken, getAllGroups);

export default groupRouter;
