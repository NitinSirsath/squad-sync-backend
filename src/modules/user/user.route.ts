import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  getUserProfile,
  getAllUsers,
  deleteUser,
  updateUserProfile,
  createUser,
} from "./controllers/user.controllers.ts";
import { authorize } from "../../middleware/authorize.ts";

const userRoutes = express.Router();

userRoutes.get("/user-info", authenticateToken, getUserProfile);
userRoutes.get("/all-users", authenticateToken, getAllUsers);
userRoutes.post("/update-user", authenticateToken, updateUserProfile);
userRoutes.post("/delete-user", authenticateToken, deleteUser);
userRoutes.post(
  "/create-user",
  authenticateToken,
  authorize(["admin", "manager"]),
  createUser
);

export { userRoutes };
