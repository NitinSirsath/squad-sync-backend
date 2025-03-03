import { Response } from "express";

export const handleError = (res: Response, error: unknown): void => {
  if (error instanceof Error) {
    res.status(400).json({ error: error.message });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
