import { Request, Response } from "express";
import InviteUserModel from "../models/InviteUserModel.ts";
import { handleError } from "../../../utils/errorHandler.ts";

// ✅ Add New Invited User
export const addNewUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, email } = req.body;

    // Check if user is already invited
    const existingUser = await InviteUserModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already invited." });
      return;
    }

    const newUser = new InviteUserModel({
      firstName,
      lastName,
      username,
      email,
    });

    await newUser.save();
    res.status(201).json({ message: "User invited successfully!", newUser });
  } catch (error) {
    console.error("Error inviting user:", error);
    handleError(res, error);
  }
};

// ✅ Get All Invited Users
export const getInvitedUsers = async (req: Request, res: Response) => {
  try {
    const invitedUsers = await InviteUserModel.find().sort({ invitedAt: -1 });
    res.status(200).json(invitedUsers);
  } catch (error) {
    console.error("Error fetching invited users:", error);
    handleError(res, error);
  }
};
