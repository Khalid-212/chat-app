import jwt from "jsonwebtoken";
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "No token provided" });
            return;
        }
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
