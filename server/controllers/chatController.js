import { prisma } from "../config/db";
export const getHistory = async (req, res) => {
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
