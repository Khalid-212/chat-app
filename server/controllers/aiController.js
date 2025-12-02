import { prisma } from "../config/db";
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Convert user description to system instruction
async function generateSystemInstruction(description) {
    try {
        const prompt = `Convert this short description into a detailed, comprehensive system instruction for an AI chatbot. The system instruction should define the AI's personality, behavior, communication style, and any specific guidelines it should follow.

User description: "${description}"

Generate a detailed system instruction that:
1. Defines the AI's personality and character
2. Specifies how it should communicate (tone, style, formality)
3. Outlines its behavior and response patterns
4. Includes any specific rules or guidelines
5. Makes it clear this is the AI's core identity

Return only the system instruction text, no additional explanation or formatting.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });
        return response.text || `You are an AI assistant. ${description}.`;
    }
    catch (error) {
        console.error("Error generating system instruction:", error);
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
        res
            .status(500)
            .json({ error: "Failed to create AI bot", details: String(error) });
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
        res
            .status(500)
            .json({ error: "Failed to get AI bots", details: String(error) });
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
        // Build conversation history for Gemini (format might differ slightly for new SDK, sticking to text block for simplicity or checking docs if needed)
        // The new SDK handles contents as string or Part object.
        // We can construct a multi-turn prompt manually or check if history is supported directly in generateContent (it's usually stateless in generateContent).
        // But the new SDK might have startChat equivalent. Let's check.
        // Actually, the user example just showed generateContent. Let's construct a text prompt to be safe and simple.
        let prompt = `System Instruction: ${aiBot.systemInstruction}\n\n`;
        if (history.length > 0) {
            prompt += "Conversation History:\n";
            history.forEach((msg) => {
                prompt += `${msg.isFromAI ? "AI" : "User"}: ${msg.content}\n`;
            });
        }
        prompt += `\nUser: ${message}\nAI:`;
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });
        const aiResponse = response.text || "";
        if (!aiResponse) {
            throw new Error("Empty response from AI");
        }
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
        res
            .status(500)
            .json({ error: "Failed to chat with AI", details: String(error) });
    }
};
