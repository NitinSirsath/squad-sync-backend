import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import userCollection from "../../../models/user/userModels.ts";
import { UserType } from "../../../types/user.types.ts";
import OrganizationModel from "../../../models/organization/organization.model.ts";
import { handleError } from "../../../utils/errorHandler.ts";

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
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      organizationName,
      industry,
    }: UserType & { organizationName: string; industry?: string } = req.body;

    if (!organizationName) {
      res.status(400).json({ error: "Organization name is required" });
      return;
    }

    // ✅ Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // ✅ Check if organization exists
    let existingOrg = await OrganizationModel.findOne({
      name: organizationName,
    }).lean();
    if (existingOrg) {
      res.status(400).json({ error: "Organization name already taken" });
      return;
    }

    // ✅ 1. **Create the organization first** (without `createdBy`)
    const newOrg = await OrganizationModel.create({
      name: organizationName,
      admins: [], // ✅ Admin will be added later
      industry: industry || "",
      membersCount: 1,
      settings: {
        allowGuestUsers: false,
        defaultRole: "employee",
      },
    });

    // ✅ 2. **Create the user with `orgId`**
    const createUser = await userCollection.create({
      username,
      email,
      password: passwordHash,
      firstName: firstName || "",
      lastName: lastName || "",
      role: "admin",
      orgId: newOrg._id, // ✅ Assign organization immediately
    });

    // ✅ 3. **Update the organization to set `createdBy` & `admins`**
    await OrganizationModel.findByIdAndUpdate(newOrg._id, {
      createdBy: createUser._id,
      admins: [createUser._id], // ✅ Store admin ID
    });

    // ✅ Remove password before sending response
    const sanitizedUser = createUser;

    res.status(201).json({
      message: "User registered successfully",
      user: sanitizedUser,
      organization: {
        _id: newOrg._id,
        name: newOrg.name,
        industry: newOrg.industry,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export { getLogin, getRegister };
