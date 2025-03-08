import { Socket } from "socket.io";
import DirectMessageModel from "../../modules/directMessages/models/directMessage.model.ts";

export const handleDirectMessage = (socket: Socket, io: any) => {
  socket.on(
    "sendDirectMessage",
    async ({ senderId, receiverId, message, messageType, fileUrl }) => {
      try {
        const newMessage = await DirectMessageModel.create({
          senderId,
          receiverId,
          message,
          messageType: messageType || "text",
          fileUrl: fileUrl || null,
        });

        io.to(receiverId).emit("receiveDirectMessage", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  );
};
