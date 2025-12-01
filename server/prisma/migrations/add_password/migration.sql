-- AlterTable: Add password column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'password'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "password" TEXT;
        
        -- Set a placeholder password for existing users
        -- Existing users will need to use password reset or create new accounts
        UPDATE "User" 
        SET "password" = '$2b$10$placeholder.hash.for.existing.users.need.reset'
        WHERE "password" IS NULL;
        
        -- Make password required
        ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
    END IF;
END $$;

