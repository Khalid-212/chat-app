import "dotenv/config";
import { defineConfig } from "prisma/config";
// import { env } from "process";
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        // seed: "tsx prisma/seed.ts",
        path: "prisma/migrations",
    },
    earlyAccess: true,
});
