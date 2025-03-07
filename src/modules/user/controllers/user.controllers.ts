import { Request, Response } from "express";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { UserType } from "../../../types/user.types.ts";
import userCollection from "../../../models/user/userModels.ts";
import { handleError } from "../../../utils/errorHandler.ts";
import redisClient from "../../../config/redis.config.ts";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";

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

    const cacheKey = `user:${decoded?.user?._id}`;

    const cacheUserInfo = await redisClient.get(cacheKey);

    if (cacheUserInfo) {
      res.status(200).json({ userInfo: JSON.parse(cacheUserInfo) });
      return;
    }

    const userObject: UserType | null = await userCollection.findOne({
      email: decoded.user.email,
    });

    if (!userObject) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const obj = {
      firstName: userObject.firstName,
      lastName: userObject.lastName,
      username: userObject.username,
      role: userObject.role,
      email: userObject.email,
      _id: userObject._id,
    };

    // ✅ Store in Redis with Expiry (1 Hour)
    await redisClient.set(cacheKey, JSON.stringify(obj));

    res.status(200).json({
      userInfo: obj,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, email, _id }: UserType = req.body;
    const cacheKey = `user:${_id}`;
    const updatedUser = await userCollection.findOneAndUpdate(
      { email },
      { firstName: firstName, lastName: lastName, username: username },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await redisClient.del(cacheKey);

    // ✅ Save updated user data in Redis (expires in 1 hour)
    const userData = {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      role: updatedUser.role,
      email: updatedUser.email,
      _id: updatedUser._id,
    };

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(userData));
    res
      .status(200)
      .json({ message: `user ${updatedUser.username} is updated` });
  } catch (error) {
    handleError(res, error);
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const cacheKey = "user:all";
    const cacheUsers = await redisClient.get(cacheKey);
    if (cacheUsers) {
      res.status(200).json({ users: JSON.parse(cacheUsers) });
      return;
    }
    const users: UserType[] = await userCollection.find().select("-password");

    if (!users || users.length === 0) {
      res.status(404).json({ message: "No users found" });
      return;
    }

    await redisClient.set(cacheKey, JSON.stringify(users));

    res.status(200).json({ users });
  } catch (error) {
    handleError(res, error);
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { _id } = req.body;
    const cacheKey = `user:${_id}`;
    await userCollection.deleteOne({ _id: _id });
    await redisClient.del(cacheKey);
    res.status(200).json({ message: "user deleted" });
  } catch (error) {
    handleError(res, error);
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const creatorId = req.user.id;
    const orgId = req.user.orgId;

    // ✅ Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const newUser = new userCollection({
      username,
      email: email || null,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || "employee",
      orgId,
      createdBy: creatorId,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        orgId: newUser.orgId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export { getUserProfile, updateUserProfile, getAllUsers, deleteUser };
