import "dotenv/config";
import { prisma } from "../config/db";
import { getIoInstance, onlineUsers } from "../socket/socketHandler";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const getGeminiApiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY environment variable is not set");
    }
    return apiKey;
};
export const createAIBot = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description } = req.body;
        if (!name || !description) {
            res.status(400).json({ error: "Name and description are required" });
            return;
        }
        const aiBot = await prisma.aIBot.create({
            data: {
                name,
                description,
                systemInstruction: `You are an AI assistant. you should have the following personality: ${description}`,
                creatorId: userId,
            },
        });
        res.json({ aiBot });
    }
    catch (error) {
        console.error("Create AI bot error:", error);
        res
            .status(500)
            .json({ error: "Failed to create AI bot", details: String(error) });
    }
};
export const getAIBots = async (req, res) => {
    try {
        const userId = req.userId;
        const aiBots = await prisma.aIBot.findMany({
            where: { creatorId: userId },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
            },
        });
        res.json({ aiBots });
    }
    catch (error) {
        console.error("Get AI bots error:", error);
        res
            .status(500)
            .json({ error: "Failed to get AI bots", details: String(error) });
    }
};
export const chatWithAI = async (req, res) => {
    try {
        const userId = req.userId;
        const { aiBotId, message } = req.body;
        if (!aiBotId || !message || typeof message !== "string") {
            res.status(400).json({ error: "AI bot ID and message are required" });
            return;
        }
        // Get AI bot
        const aiBot = await prisma.aIBot.findUnique({
            where: { id: aiBotId },
        });
        if (!aiBot) {
            res.status(404).json({ error: "AI bot not found" });
            return;
        }
        // Save user message immediately
        const userMessage = await prisma.message.create({
            data: {
                content: message,
                senderId: userId,
                receiverId: userId, // Self-reference for AI conversations
                aiBotId: aiBotId,
                isFromAI: false,
            },
        });
        // Return user message immediately
        res.json({ userMessage });
        // Show typing indicator for AI bot
        const ioInstance = getIoInstance();
        if (ioInstance) {
            const userSocketId = onlineUsers.get(userId);
            if (userSocketId) {
                ioInstance.to(userSocketId).emit("user_typing", { userId: aiBotId });
            }
        }
        // Process AI response asynchronously
        (async () => {
            try {
                const apiKey = getGeminiApiKey();
                if (!apiKey) {
                    throw new Error("GEMINI_API_KEY is not configured");
                }
                const response = await fetch(GEMINI_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: message,
                                    },
                                ],
                            },
                        ],
                        systemInstruction: {
                            parts: [
                                {
                                    text: aiBot.systemInstruction,
                                },
                            ],
                        },
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
                }
                const data = await response.json();
                const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (!aiResponse) {
                    throw new Error("Empty response from AI");
                }
                // Stop typing indicator
                const ioInstance = getIoInstance();
                if (ioInstance) {
                    const userSocketId = onlineUsers.get(userId);
                    if (userSocketId) {
                        ioInstance
                            .to(userSocketId)
                            .emit("user_stopped_typing", { userId: aiBotId });
                    }
                }
                // Save AI response
                const aiMessage = await prisma.message.create({
                    data: {
                        content: aiResponse,
                        senderId: userId,
                        receiverId: userId,
                        aiBotId: aiBotId,
                        isFromAI: true,
                    },
                });
                // Send AI message via socket
                if (ioInstance) {
                    const userSocketId = onlineUsers.get(userId);
                    if (userSocketId) {
                        ioInstance.to(userSocketId).emit("receive_message", aiMessage);
                    }
                }
            }
            catch (error) {
                console.error("Error processing AI response:", error);
                // Stop typing indicator on error
                const ioInstance = getIoInstance();
                if (ioInstance) {
                    const userSocketId = onlineUsers.get(userId);
                    if (userSocketId) {
                        ioInstance
                            .to(userSocketId)
                            .emit("user_stopped_typing", { userId: aiBotId });
                    }
                }
            }
        })();
    }
    catch (error) {
        console.error("Error chatting with AI:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        res
            .status(500)
            .json({ error: "Failed to chat with AI", details: errorMessage });
    }
};
