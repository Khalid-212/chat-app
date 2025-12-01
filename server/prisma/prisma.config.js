import "dotenv/config";
import { defineConfig } from "prisma/config";
// import { env } from "process";
export default defineConfig({
    schema: "schema.prisma",
    migrations: {
        // seed: "tsx prisma/seed.ts",
        path: "migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/chat-app",
    },
});
