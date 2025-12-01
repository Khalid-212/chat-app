import { Request, Response } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../middleware/auth";

export const getHistory = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as AuthRequest).userId;
    const { otherId } = req.params;

    if (!otherId) {
      res.status(400).json({ error: "Other user ID is required" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherId },
          { senderId: otherId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Failed to get chat history", details: String(error) });
  }
};
