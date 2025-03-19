import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken.ts";
import {
  createBugReport,
  getAllBugReports,
  updateBugReport,
} from "./controllers/bug.controllers.ts";

const bugRouter = express.Router();

// Create a bug report
bugRouter.post("/create-bug", authenticateToken, createBugReport);

// Get all bug reports
bugRouter.get("/", authenticateToken, getAllBugReports);

// Update bug report status
bugRouter.post("/update-bug", authenticateToken, updateBugReport);

export default bugRouter;
