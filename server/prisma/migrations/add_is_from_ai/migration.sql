-- AlterTable: Add isFromAI column
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isFromAI" BOOLEAN DEFAULT false;
