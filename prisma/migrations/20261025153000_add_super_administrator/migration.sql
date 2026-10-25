-- Add super_administrator column to User table
ALTER TABLE "User" ADD COLUMN "super_administrator" BOOLEAN NOT NULL DEFAULT false;

-- Update existing users: the first admin created during setup should be marked as super admin
-- (This is handled by the application logic - setup creates super admin explicitly)