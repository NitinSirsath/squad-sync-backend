import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import BugReportModel from "../models/BugReportModel.ts";
import UserModel from "../../../models/user/userModels.ts";

// ✅ Create a Bug Report
export const createBugReport = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }
    const { title, category, severity, description } = req.body;
    const userId = req.user._id; // Authenticated user's ID
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const bugReport = new BugReportModel({
      title,
      category,
      severity,
      description,
      reportedBy: userId,
      organization: user.activeOrg, // Use user's active organization
    });

    await bugReport.save();
    res
      .status(201)
      .json({ message: "Bug report created successfully", bugReport });
  } catch (error) {
    console.error("Error creating bug report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get All Bug Reports
export const getAllBugReports = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const bugs = await BugReportModel.find()
      .populate("reportedBy", "username email") // Populate user details
      .populate("organization", "name") // Populate organization details
      .sort({ createdAt: -1 }); // Latest bugs first

    res.status(200).json(bugs);
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update Bug Report (Fixing or Changing Status)
export const updateBugReport = async (req: Request, res: Response) => {
  try {
    const { bugId, status } = req.body; // ✅ Read bugId from request body

    if (!bugId) {
      res.status(400).json({ message: "Bug ID is required" });
      return;
    }

    if (!["open", "in-progress", "fixed"].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const bug = await BugReportModel.findById(bugId);
    if (!bug) {
      res.status(404).json({ message: "Bug report not found" });
      return;
    }

    bug.status = status;
    await bug.save();

    res.status(200).json({ message: "Bug report updated successfully", bug });
  } catch (error) {
    console.error("Error updating bug report:", error);
    res.status(500).json({ message: "Server error" });
  }
};
