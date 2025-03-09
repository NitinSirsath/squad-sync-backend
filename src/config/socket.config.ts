import { Server } from "socket.io";
import http from "http";
import { authenticateSocket } from "../middleware/authenticateSocket.ts";
import { AuthenticatedSocketType } from "../types/socket/socket.types.ts";
import MessageModel from "../modules/groupMessages/models/groupMessage.model.ts";

const activeUsers = new Map<string, string>(); // Track online users

export const initializeSocket = (server: http.Server): Server => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.use(authenticateSocket); // ✅ Authenticate WebSocket connections

  io.on("connection", (socket: AuthenticatedSocketType) => {
    const userId = socket.user?.id;
    console.log(`User connected: ${userId}`);

    // ✅ Store user in active users
    if (userId) activeUsers.set(userId, socket.id);

    // ✅ User joins a group room
    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log(`User ${userId} joined group ${groupId}`);
    });

    // ✅ Handle message sending
    socket.on(
      "sendMessage",
      async ({ groupId, message, messageType, fileUrl }) => {
        if (!userId) return;

        const newMessage = await MessageModel.create({
          groupId,
          senderId: userId,
          message,
          messageType,
          fileUrl,
        });

        io.to(groupId).emit("newMessage", newMessage); // ✅ Broadcast message to group
      }
    );

    // ✅ Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      if (userId) activeUsers.delete(userId);
    });
  });

  return io;
};
