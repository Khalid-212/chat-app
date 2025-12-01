import { prisma } from "../config/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
export const signup = async (req, res) => {
    const { email, password, name, picture } = req.body;
    console.log("Signup request:", { email, name });
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split("@")[0],
                picture: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email}`,
            },
        });
        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "secret", {
            expiresIn: "30d",
        });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Signup failed", details: String(error) });
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login request:", { email });
    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "secret", {
            expiresIn: "30d",
        });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed", details: String(error) });
    }
};
export const getProfile = async (req, res) => {
    try {
        const userId = req.userId; // Set by auth middleware
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                picture: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Failed to get profile", details: String(error) });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId; // Set by auth middleware
        const { name, picture } = req.body;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(picture && { picture }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                picture: true,
                createdAt: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile", details: String(error) });
    }
};
