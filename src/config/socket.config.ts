// import { Server } from "socket.io";
// import { createServer } from "http";
// import { Express } from "express";
// import DirectMessageModel from "../modules/directMessages/models/directMessage.model.ts";
// import MessageModel from "../modules/groupMessages/models/groupMessage.model.ts";
// import UserModel from "../models/user/userModels.ts";
// import GroupMemberModel from "../modules/groupMembers/model/groupMember.model.ts";

// const connectedUsers = new Map<string, string>(); // Map<userId, socketId>

// export const setupSocketIO = (app: Express) => {
//   const server = createServer(app);
//   const io = new Server(server, {
//     cors: {
//       origin: "http://localhost:5173",
//       methods: ["GET", "POST"],
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log("🔌 New client connected:", socket.id);

//     // ✅ Register user upon connection
//     socket.on("registerUser", (userId) => {
//       console.log(`📞 User ${userId} registered with Socket ID: ${socket.id}`);
//       connectedUsers.set(userId, socket.id);
//       io.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
//     });

//     // ✅ Handle sending a direct message
//     socket.on("sendMessage", async (data) => {
//       console.log("📩 Direct Message received:", data);

//       const { senderId, receiverId, message, messageType, fileURL } = data;

//       const sender = await UserModel.findById(senderId).lean();
//       const receiver = await UserModel.findById(receiverId).lean();

//       if (!sender || !receiver) {
//         return socket.emit("sendMessageError", "Invalid sender or receiver.");
//       }

//       const newMessage = await DirectMessageModel.create({
//         senderId,
//         senderName: `${sender.firstName} ${sender.lastName}`,
//         receiverId,
//         receiverName: `${receiver.firstName} ${receiver.lastName}`,
//         message,
//         messageType,
//         fileUrl: fileURL || null,
//         seen: false,
//       });

//       console.log("✅ Direct Message saved:", newMessage);

//       // ✅ Send to receiver
//       const receiverSocketId = connectedUsers.get(receiverId);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("newMessage", newMessage);
//       }

//       // ✅ ALSO send back to sender
//       const senderSocketId = connectedUsers.get(senderId);
//       if (senderSocketId) {
//         io.to(senderSocketId).emit("newMessage", newMessage);
//       }

//       // ✅ Emit event to refresh chat list
//       io.emit("updateChatList");
//     });

//     // ✅ Handle group messages
//     socket.on("joinGroup", (groupId) => {
//       socket.join(groupId);
//       console.log(`📌 User joined group ${groupId}`);
//     });

//     socket.on("leaveGroup", (groupId) => {
//       socket.leave(groupId);
//       console.log(`❌ User left group ${groupId}`);
//     });

//     socket.on("sendGroupMessage", async (data) => {
//       console.log("📩 Group Message received:", data);

//       const { groupId, senderId, message, messageType, fileUrl } = data;

//       // ✅ Check if sender is a member of the group
//       const isMember = await GroupMemberModel.exists({
//         groupId,
//         userId: senderId,
//       });

//       if (!isMember) {
//         return socket.emit(
//           "sendMessageError",
//           "You are not a member of this group."
//         );
//       }

//       const newMessage = await MessageModel.create({
//         groupId,
//         senderId,
//         message,
//         messageType,
//         fileUrl,
//       });

//       console.log("✅ Group Message saved:", newMessage);

//       // ✅ Broadcast message to all group members
//       io.to(groupId).emit("newGroupMessage", newMessage);
//     });

//     // ✅ Handle user disconnect
//     socket.on("disconnect", () => {
//       const userId = [...connectedUsers.entries()].find(
//         ([_, socketId]) => socketId === socket.id
//       )?.[0];

//       if (userId) {
//         connectedUsers.delete(userId);
//       }

//       io.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
//       console.log("❌ Client disconnected:", socket.id);
//     });
//   });

//   return { server, io };
// };
