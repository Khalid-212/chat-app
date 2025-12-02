-- CreateTable
CREATE TABLE IF NOT EXISTS "AIBot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemInstruction" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIBot_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add aiBotId to Message
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "aiBotId" TEXT;

-- AddForeignKey
ALTER TABLE "AIBot" ADD CONSTRAINT "AIBot_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_aiBotId_fkey" FOREIGN KEY ("aiBotId") REFERENCES "AIBot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

