import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import userCollection, { User } from "../../../models/user/userModels.ts";
import { UserType } from "../../../types/user.types.ts";
import { handleError } from "../../../utils/errorHandler.ts";
import { AuthenticatedRequest } from "../../../types/authRequest.types.ts";
import jwt from "jsonwebtoken";

const getLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: UserType | null = await userCollection.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }
    const token = jsonwebtoken.sign(
      { user },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "24h",
      }
    );
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Server error" });
  }
};

const getRegister = async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName }: UserType =
      req.body;

    // ✅ Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // ✅ Create the user without any organization
    const createUser = await userCollection.create({
      username,
      email,
      password: passwordHash,
      firstName: firstName || "",
      lastName: lastName || "",
      profilePicture: "",
      role: "admin", // ✅ Default role as admin (until they join an org)
      organizations: [], // ✅ Empty organizations initially
    });

    // ✅ Remove password before sending response
    const sanitizedUser = createUser;

    res.status(201).json({
      message: "User registered successfully",
      user: sanitizedUser,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getLogout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Unauthorized: Token missing" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.user) {
      res.status(401).json({ error: "Invalid Token" });
      return;
    }

    // ✅ Fetch the full user from DB (to get organizations)
    const user: User | null = await userCollection
      .findById(decoded.user._id)
      .lean();

    const userId = user?._id; // ✅ Authenticated User

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }
    if (!req.user) {
      res.status(401).json({ error: "not authorized" });
    }
    res.status(200).json({ message: "logout successfull" });
  } catch (error) {
    handleError(res, error);
  }
};

export { getLogin, getRegister, getLogout };
