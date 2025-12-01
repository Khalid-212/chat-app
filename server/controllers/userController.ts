import { Request, Response } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../middleware/auth";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        createdAt: true,
      },
    });
    
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users", details: String(error) });
  }
};
