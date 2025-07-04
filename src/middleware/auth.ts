import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../utils/types.js";
import { client } from "../config/clients/index.js";

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401).json({ data: null, error: "Unauthorized User" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const session = await client.user_sessions.findFirst({
    where: {
      token: token,
    },
  });
  const now = new Date();
  if (!session || new Date(session.expires_at) < now) {
    res.status(401).json({ data: null, error: "Unauthorized User" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ data: null, error: "Invalid or expired token" });
  }
};
