import { Request, Response } from "express";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { UserType } from "../../../types/user.types.ts";
import userCollection from "../../../models/user/userModels.ts";
import { handleError } from "../../../utils/errorHandler.ts";
import redisClient from "../../../config/redis.config.ts";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import OrganizationModel from "../../../models/organization/organization.model.ts";

interface DecodedUserToken extends JwtPayload {
  user: UserType;
}

const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
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

    // if (cacheUserInfo) {
    //   res.status(200).json({ userInfo: JSON.parse(cacheUserInfo) });
    //   return;
    // }

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
      // userInfo: obj,
      userObject,
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

    if (role === "admin") {
      res.status(403).json({ error: "Cannot assign admin role" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const adminId = req.user._id;
    const activeOrg = req.user.activeOrg;

    if (!activeOrg) {
      res.status(400).json({ error: "No active organization selected" });
      return;
    }

    // ✅ Check if the user already exists
    let user = await userCollection.findOne({ email });

    if (user) {
      // ✅ Check if user is already part of the organization
      const isAlreadyInOrg = user.organizations.some(
        (org) => org.orgId.toString() === activeOrg.toString()
      );

      if (isAlreadyInOrg) {
        res
          .status(400)
          .json({ error: "User is already a member of this organization" });
        return;
      }

      // ✅ Add existing user to the organization
      await userCollection.findByIdAndUpdate(user._id, {
        $push: { organizations: { orgId: activeOrg, role } },
      });

      // ✅ Also update the `OrganizationModel` to track new members
      await OrganizationModel.findByIdAndUpdate(activeOrg, {
        $push: { members: user._id },
      });

      res.status(200).json({ message: "User invited to organization" });
      return;
    }

    // ✅ If user does not exist, create a new one
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userCollection.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      profilePicture: "",
      organizations: [{ orgId: activeOrg, role }], // ✅ Assign organization
      activeOrg, // ✅ Default to first organization
    });

    // ✅ Also update the `OrganizationModel` to track new members
    await OrganizationModel.findByIdAndUpdate(activeOrg, {
      $push: { members: newUser._id },
    });

    res.status(201).json({
      message: "User created and added to organization",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        organizations: newUser.organizations,
        activeOrg: newUser.activeOrg, // ✅ Ensure frontend knows the active org
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { getUserProfile, updateUserProfile, getAllUsers, deleteUser };
