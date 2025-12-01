import { Request, Response } from "express";
import { prisma } from "../config/db";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, name, picture } = req.body;
  console.log("Login request:", { email, name, picture });

  try {
    // Simple upsert: create if new, update if exists
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, picture },
      create: { email, name, picture },
    });
    console.log("User upserted:", user);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "1d",
      }
    );

    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Auth failed", details: String(error) });
  }
};
