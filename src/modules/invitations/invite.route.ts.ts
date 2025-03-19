import express from "express";
import {
  addNewUser,
  getInvitedUsers,
} from "./controllers/invite.controllers.ts";

const inviteRouter = express.Router();

// ✅ API to invite a new user
inviteRouter.post("/addNewUser", addNewUser);

// ✅ API to get all invited users
inviteRouter.get("/invitedUsers", getInvitedUsers);

export default inviteRouter;
