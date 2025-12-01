import { Router } from "express";
import { signup, login, getProfile, updateProfile } from "../controllers/authController";
import { getUsers } from "../controllers/userController";
import { getHistory } from "../controllers/chatController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Auth routes (public)
router.post("/auth/signup", signup);
router.post("/auth/login", login);

// Protected routes
router.get("/auth/profile", authenticate, getProfile);
router.put("/auth/profile", authenticate, updateProfile);
router.get("/users", authenticate, getUsers);
router.get("/messages/:otherId", authenticate, getHistory);

export default router;
