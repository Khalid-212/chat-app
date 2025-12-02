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

    // Get user's AI bots
    const aiBots = await prisma.aIBot.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });
    
    // Format AI bots as users with a flag
    const aiBotsAsUsers = aiBots.map((bot) => ({
      id: bot.id,
      email: `ai-${bot.id}@chat-app.ai`,
      name: bot.name,
      picture: null,
      createdAt: bot.createdAt,
      isAI: true,
    }));
    
    res.json([...users, ...aiBotsAsUsers]);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users", details: String(error) });
  }
};
