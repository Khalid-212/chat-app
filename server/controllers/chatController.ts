import { Request, Response } from "express";
import { prisma } from "../config/db";

export const getHistory = async (req: Request, res: Response) => {
  const { userId, otherId } = req.params;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages);
};
