import { Router } from "express";
import { login } from "../controllers/authController";
import { getUsers } from "../controllers/userController";
import { getHistory } from "../controllers/chatController";

const router = Router();

router.post("/auth/login", login);
router.get("/users", getUsers);
router.get("/messages/:userId/:otherId", getHistory);

export default router;
