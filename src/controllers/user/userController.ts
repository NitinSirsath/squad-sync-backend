import { Request, Response } from "express";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { handleError } from "../../utils/errorHandler.ts";
import { UserType } from "../../types/user.types.ts";
import userCollection from "../../models/user/userModels.ts";

interface DecodedUserToken extends JwtPayload {
  user: UserType;
}

const getUserProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(400).json({ error: "Unauthorized: Token missing" });
      return;
    }

    const decoded = jsonwebtoken.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedUserToken; // Explicit type assertion

    const userObject: UserType | null = await userCollection.findOne({
      email: decoded.user.email,
    });

    res.status(200).json({
      firstName: userObject?.firstName,
      lastName: userObject?.lastName,
      username: userObject?.username,
      role: userObject?.role,
      email: userObject?.email,
      _id: userObject?._id,
    });
  } catch (error) {
    handleError(res, error);
  }
};
const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, email }: UserType = req.body;
    const updateU = await userCollection.findOneAndUpdate(
      { email },
      { firstName: firstName, lastName: lastName, username: username },
      { new: true }
    );
    res.status(200).json({ updateU });
  } catch (error) {
    handleError(res, error);
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users: UserType[] = await userCollection.find().select("-password");

    if (!users || users.length === 0) {
      res.status(404).json({ message: "No users found" });
      return;
    }

    res.status(200).json({ users });
  } catch (error) {
    handleError(res, error);
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { _id } = req.body;
    await userCollection.deleteOne({ _id: _id });
    res.status(200).json({ message: "user deleted" });
  } catch (error) {
    handleError(res, error);
  }
};

export { getUserProfile, updateUserProfile, getAllUsers, deleteUser };
