import { Request, Response } from "express";
import userCollection from "../../models/user/userModels.ts";
import { UserType } from "../../types/user.types.ts";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";

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
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const createUser = await userCollection.create({
      username: username,
      email: email,
      password: passwordHash,
      firstName: firstName,
      lastName: lastName,
    });
    res.status(200).json({ message: true, createUser });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
};

export { getLogin, getRegister };
