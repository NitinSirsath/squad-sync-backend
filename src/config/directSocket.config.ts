import { Server } from "socket.io";
import { createServer } from "http";
import { Express } from "express";
import DirectMessageModel from "../modules/directMessages/models/directMessage.model.ts";
import MessageModel from "../modules/groupMessages/models/groupMessage.model.ts";
import UserModel from "../models/user/userModels.ts";
import GroupMemberModel from "../modules/groupMembers/model/groupMember.model.ts";
import mongoose from "mongoose";

const connectedUsers = new Map<string, string>(); // Map<userId, socketId>

export const setupSocketIO = (app: Express) => {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // ✅ Register user upon connection
    socket.on("registerUser", (userId) => {
      console.log(`📞 User ${userId} registered with Socket ID: ${socket.id}`);
      connectedUsers.set(userId, socket.id);
      io.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
    });

    // ✅ Handle sending a direct message
    socket.on("sendDirectMessage", async (data) => {
      console.log("📩 Direct Message received:", data);

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

      console.log("✅ Direct Message saved:", newMessage);

      // ✅ Send to receiver
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newDirectMessage", newMessage);
      }

      // ✅ ALSO send back to sender
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("newDirectMessage", newMessage);
      }

      // ✅ Emit event to refresh chat list
      io.emit("updateChatList");
    });

    socket.on("markMessagesAsSeen", async ({ senderId, receiverId }) => {
      console.log(
        `✅ Marking messages from ${senderId} as seen by ${receiverId}`
      );

      if (
        !mongoose.Types.ObjectId.isValid(senderId) ||
        !mongoose.Types.ObjectId.isValid(receiverId)
      ) {
        return socket.emit("markSeenError", "Invalid sender or receiver ID.");
      }

      // ✅ Update seen status for all unread messages
      await DirectMessageModel.updateMany(
        { senderId, receiverId, seen: false },
        { seen: true }
      );

      // ✅ Notify sender that their messages were seen
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesMarkedAsSeen", {
          senderId,
          receiverId,
        });
      }

      console.log(
        `✅ Messages from ${senderId} to ${receiverId} marked as seen`
      );
    });

    // ✅ Handle group messages
    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log(`📌 User joined group ${groupId}`);
    });

    socket.on("leaveGroup", (groupId) => {
      socket.leave(groupId);
      console.log(`❌ User left group ${groupId}`);
    });

    socket.on("sendGroupMessage", async (data) => {
      console.log("📩 Group Message received:", data);

      const { groupId, senderId, message, messageType, fileUrl } = data;

      // ✅ Ensure sender is in the room
      socket.join(groupId);

      // ✅ Check if sender is a member of the group
      const isMember = await GroupMemberModel.exists({
        groupId,
        userId: senderId,
      });

      if (!isMember) {
        return socket.emit(
          "sendMessageError",
          "You are not a member of this group."
        );
      }

      const newMessage = await MessageModel.create({
        groupId,
        senderId,
        message,
        messageType,
        fileUrl,
      });

      console.log("✅ Group Message saved:", newMessage);

      // ✅ Wait before broadcasting to ensure room join is completed
      setTimeout(() => {
        io.to(groupId).emit("newGroupMessage", newMessage);
      }, 100); // ⏳ Small delay to ensure user joins the room before receiving messages
    });

    // ✅ Handle user disconnect
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
