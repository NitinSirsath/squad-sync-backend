import express, { Request, Response } from "express";
import connectDB from "./config/mongoDB.config.ts";
import { config } from "dotenv";
import cors from "cors";

import authRoutes from "./modules/auth/auth.route.ts";
import { userRoutes } from "./modules/user/user.route.ts";
import groupRoutes from "./modules/group/group.route.ts";
import groupMemberRoutes from "./modules/groupMembers/groupMember.route.ts";
import messageRoutes from "./modules/messages/message.route.ts";
import { directMessageRoutes } from "./modules/directMessages/directMessage.route.ts";
import { setupSocketIO } from "./config/directSocket.config.ts";

config();
const app = express();
const port = process.env.PORT || 3000;

// ✅ Apply CORS middleware before routes
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());

// ✅ Setup WebSocket (Returns `server` and `io`)
const { server } = setupSocketIO(app);

// ✅ API Routes
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/group-members", groupMemberRoutes);
app.use("/api/group-messages", messageRoutes);
app.use("/api/direct-messages", directMessageRoutes);

// ✅ Connect Database
connectDB();

// ✅ Start server
server.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
