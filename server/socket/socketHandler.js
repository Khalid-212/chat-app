import { prisma } from "../config/db";
export const onlineUsers = new Map();
let _ioInstance = null;
export const getIoInstance = () => {
    return _ioInstance;
};
export const setupSocket = (io) => {
    _ioInstance = io;
    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            onlineUsers.set(userId, socket.id);
            // Broadcast status to others
            io.emit("user_status", { userId, status: "online" });
            // Send list of online users to the new connection
            const onlineUserIds = Array.from(onlineUsers.keys());
            socket.emit("online_users", onlineUserIds);
            console.log(`User connected: ${userId}`);
        }
        // Typing Events
        socket.on("typing_start", (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("user_typing", { userId });
            }
        });
        socket.on("typing_stop", (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("user_stopped_typing", { userId });
            }
        });
        socket.on("send_message", async (data) => {
            const { senderId, receiverId, content } = data;
            try {
                // Save to DB
                const message = await prisma.message.create({
                    data: { senderId, receiverId, content },
                });
                // Send to receiver if online
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }
                // Ack to sender
                socket.emit("message_sent", message);
            }
            catch (error) {
                console.error("Error sending message:", error);
            }
        });
        socket.on("disconnect", () => {
            if (userId) {
                onlineUsers.delete(userId);
                io.emit("user_status", { userId, status: "offline" });
            }
        });
    });
};
