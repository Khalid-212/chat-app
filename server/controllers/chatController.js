import { prisma } from "../config/db";
export const getHistory = async (req, res) => {
    try {
        const currentUserId = req.userId;
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
    }
    catch (error) {
        console.error("Get history error:", error);
        res.status(500).json({ error: "Failed to get chat history", details: String(error) });
    }
};
