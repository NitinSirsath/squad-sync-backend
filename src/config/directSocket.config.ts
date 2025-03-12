import { Server } from "socket.io";
import { createServer } from "http";
import { Express } from "express";
import DirectMessageModel from "../modules/directMessages/models/directMessage.model.ts";
import UserModel from "../models/user/userModels.ts";

const connectedUsers = new Map<string, string>(); // Map<userId, socketId>

export const setupSocketIO = (app: Express) => {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Register user to socket
    socket.on("registerUser", (userId) => {
      console.log(`📞 User ${userId} registered with Socket ID: ${socket.id}`);
      connectedUsers.set(userId, socket.id);
      io.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
    });

    // Handle sending a direct message
    socket.on("sendMessage", async (data) => {
      console.log("📩 Message received via WebSocket:", data);

      const { senderId, receiverId, message, messageType, fileURL } = data;

      const sender = await UserModel.findById(senderId).lean();
      const receiver = await UserModel.findById(receiverId).lean();

      if (!sender || !receiver) {
        return socket.emit("sendMessageError", "Invalid sender or receiver.");
      }

      const newMessage = await DirectMessageModel.create({
        senderId,
        senderName: `${sender.firstName} ${sender.lastName}`,
        receiverId,
        receiverName: `${receiver.firstName} ${receiver.lastName}`,
        message,
        messageType,
        fileUrl: fileURL || null,
        seen: false,
      });

      console.log("✅ Message saved:", newMessage);

      // Emit to receiver
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

      // Emit to sender for confirmation
      io.to(socket.id).emit("messageSent", newMessage);
    });

    // Disconnect user
    socket.on("disconnect", () => {
      const userId = [...connectedUsers.entries()].find(
        ([_, socketId]) => socketId === socket.id
      )?.[0];

      if (userId) {
        connectedUsers.delete(userId);
      }

      io.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  return { server, io };
};
