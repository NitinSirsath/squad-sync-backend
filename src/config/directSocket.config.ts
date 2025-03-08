import { Server } from "socket.io";
import { createServer } from "http";
import { Express } from "express";

const connectedPeers = new Map<string, string>(); // Map<userId, peerId>

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

    socket.on("registerPeer", ({ userId, peerId }) => {
      console.log(`📞 User ${userId} registered with Peer ID: ${peerId}`);
      connectedPeers.set(userId, peerId);
      io.emit("updateOnlineUsers", Array.from(connectedPeers.keys()));
    });

    socket.on("disconnect", () => {
      const userId = [...connectedPeers.entries()].find(
        ([_, peer]) => peer === socket.id
      )?.[0];

      if (userId) {
        connectedPeers.delete(userId);
      }

      io.emit("updateOnlineUsers", Array.from(connectedPeers.keys()));
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  return { server, io };
};
