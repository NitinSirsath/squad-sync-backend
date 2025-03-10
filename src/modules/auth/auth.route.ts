import express from "express";
import {
  getLogin,
  getLogout,
  getRegister,
} from "./controllers/auth.controllers.ts";

const authRoutes = express.Router();

authRoutes.post("/login", getLogin);
authRoutes.post("/register", getRegister);
authRoutes.post("/logout", getLogout);

export default authRoutes;
