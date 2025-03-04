import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedSocketType } from "../types/socket/socket.types.ts";

export const authenticateSocket = (
  socket: AuthenticatedSocketType,
  next: (err?: any) => void
) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.user) {
      throw new Error("Invalid Token");
    }

    socket.user = {
      id: decoded.user._id,
      email: decoded.user.email,
      role: decoded.user.role,
    };

    next();
  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    next(new Error("Unauthorized"));
  }
};
