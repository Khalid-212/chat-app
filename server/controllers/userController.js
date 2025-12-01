import { prisma } from "../config/db";
export const getUsers = async (req, res) => {
    try {
        const userId = req.userId;
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
    }
    catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Failed to get users", details: String(error) });
    }
};
