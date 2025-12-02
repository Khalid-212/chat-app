import { Router } from "express";
import { signup, login, getProfile, updateProfile } from "../controllers/authController";
import { getUsers } from "../controllers/userController";
import { getHistory } from "../controllers/chatController";
import { createAIBot, getAIBots, chatWithAI } from "../controllers/aiController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Health check (public)
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth routes (public)
router.post("/auth/signup", signup);
router.post("/auth/login", login);

// Protected routes
router.get("/auth/profile", authenticate, getProfile);
router.put("/auth/profile", authenticate, updateProfile);
router.get("/users", authenticate, getUsers);
router.get("/messages/:otherId", authenticate, getHistory);

// AI routes
router.post("/ai/create", authenticate, createAIBot);
router.get("/ai/bots", authenticate, getAIBots);
router.post("/ai/chat", authenticate, chatWithAI);

export default router;
