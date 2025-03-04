import express, { Request, Response } from "express";
import connectDB from "./config/mongoDB.config.ts";
import { config } from "dotenv";
import authRoutes from "./modules/auth/auth.route.ts";
import { userRoutes } from "./modules/user/user.route.ts";
import groupRoutes from "./modules/group/group.route.ts";
import groupMemberRoutes from "./modules/groupMembers/groupMember.route.ts";
import messageRoutes from "./modules/messages/message.route.ts";

config();
const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

connectDB();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/group-members", groupMemberRoutes);
app.use("/api/messages", messageRoutes);
