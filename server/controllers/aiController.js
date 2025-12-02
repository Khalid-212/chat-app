import { prisma } from "../config/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Convert user description to system instruction
async function generateSystemInstruction(description) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const prompt = `Convert this short description into a detailed, comprehensive system instruction for an AI chatbot. The system instruction should define the AI's personality, behavior, communication style, and any specific guidelines it should follow.

User description: "${description}"

Generate a detailed system instruction that:
1. Defines the AI's personality and character
2. Specifies how it should communicate (tone, style, formality)
3. Outlines its behavior and response patterns
4. Includes any specific rules or guidelines
5. Makes it clear this is the AI's core identity

Return only the system instruction text, no additional explanation or formatting.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    }
    catch (error) {
        console.error("Error generating system instruction:", error);
        // Fallback to a basic system instruction
        return `You are an AI assistant. ${description}. Be helpful, friendly, and engaging in your responses.`;
    }
}
// Create AI bot
export const createAIBot = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description } = req.body;
        if (!name || !description) {
            res.status(400).json({ error: "Name and description are required" });
            return;
        }
        // Generate system instruction from description
        const systemInstruction = await generateSystemInstruction(description);
        // Create AI bot
        const aiBot = await prisma.aIBot.create({
            data: {
                name,
                description,
                systemInstruction,
                creatorId: userId,
            },
        });
        res.json({ aiBot });
    }
    catch (error) {
        console.error("Create AI bot error:", error);
        res.status(500).json({ error: "Failed to create AI bot", details: String(error) });
    }
};
// Get user's AI bots
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
        res.status(500).json({ error: "Failed to get AI bots", details: String(error) });
    }
};
// Chat with AI
export const chatWithAI = async (req, res) => {
    try {
        const userId = req.userId;
        const { aiBotId, message } = req.body;
        if (!aiBotId || !message) {
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
        // Get chat history
        const history = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, aiBotId: aiBotId },
                    { aiBotId: aiBotId, receiverId: userId },
                ],
            },
            orderBy: { createdAt: "asc" },
            take: 20, // Last 20 messages for context
        });
        // Build conversation history for Gemini
        const conversationHistory = history.map((msg) => ({
            role: msg.senderId === userId ? "user" : "model",
            parts: [{ text: msg.content }],
        }));
        // Initialize model with system instruction
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
        });
        // Build the full prompt with system instruction and history
        let fullPrompt = `System Instruction: ${aiBot.systemInstruction}\n\n`;
        if (conversationHistory.length > 0) {
            fullPrompt += "Conversation History:\n";
            conversationHistory.forEach((msg) => {
                fullPrompt += `${msg.role === "user" ? "User" : "AI"}: ${msg.parts[0].text}\n`;
            });
        }
        fullPrompt += `\nUser: ${message}\nAI:`;
        // Generate response
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const aiResponse = response.text();
        // Save user message (for AI conversations, we use userId for both sender/receiver)
        const userMessage = await prisma.message.create({
            data: {
                content: message,
                senderId: userId,
                receiverId: userId, // Self-reference for AI conversations
                aiBotId: aiBotId,
                isFromAI: false,
            },
        });
        // Save AI response (marked with isFromAI flag)
        const aiMessage = await prisma.message.create({
            data: {
                content: aiResponse,
                senderId: userId, // Using user ID as placeholder (AI bots aren't users)
                receiverId: userId,
                aiBotId: aiBotId,
                isFromAI: true, // Flag to identify AI messages
            },
        });
        res.json({
            userMessage,
            aiMessage,
        });
    }
    catch (error) {
        console.error("Chat with AI error:", error);
        res.status(500).json({ error: "Failed to chat with AI", details: String(error) });
    }
};
