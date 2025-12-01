import { prisma } from "../config/db";
export const getUsers = async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
};
