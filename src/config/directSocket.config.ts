import { Server } from "socket.io";
import { createServer } from "http";
import { Express } from "express";

export const setupSocketIO = (app: Express) => {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("sendDirectMessage", (message) => {
      console.log("Received direct message:", message);
      socket.broadcast.emit("receiveDirectMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return { server, io };
};
