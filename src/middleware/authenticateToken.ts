import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Define an extended Request type to include user property
declare module "express-serve-static-core" {
  interface Request {
    user?: string | JwtPayload;
  }
}

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader: string | undefined = req.headers["authorization"];
    const token: string | undefined = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res
        .status(401)
        .json({ success: false, error: "Unauthorized: Token missing" });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
        res
          .status(403)
          .json({ success: false, error: "Unauthorized: Invalid token" });
        return;
      }
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export { authenticateToken };
