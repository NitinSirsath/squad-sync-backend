import express from "express";
import {
  getLogin,
  getRegister,
} from "../../controllers/auth/authController.ts";

const authRoutes = express.Router();

authRoutes.post("/login", getLogin);
authRoutes.post("/register", getRegister);

export default authRoutes;
