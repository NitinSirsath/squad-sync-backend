import { Socket } from "socket.io";

export const handleVoiceCall = (socket: Socket, io: any) => {
  socket.on("callUser", ({ userToCall, signalData, from }) => {
    io.to(userToCall).emit("incomingCall", { signal: signalData, from });
  });

  socket.on("answerCall", ({ to, signal }) => {
    io.to(to).emit("callAccepted", signal);
  });

  socket.on("endCall", ({ to }) => {
    io.to(to).emit("callEnded");
  });
};
