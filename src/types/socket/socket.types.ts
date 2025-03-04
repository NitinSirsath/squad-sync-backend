import { Socket } from "socket.io";

export interface AuthenticatedSocketType extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
