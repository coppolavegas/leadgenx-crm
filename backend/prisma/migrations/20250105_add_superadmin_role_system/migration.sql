-- AlterTable: Update user role column to support new role system
-- Migrate existing roles to new role system:
--   'member' -> 'user'
--   'admin' -> 'workspace_admin'
--   'owner' -> 'workspace_admin'

-- Step 1: Update existing user roles
UPDATE "users" SET "role" = 'user' WHERE "role" = 'member';
UPDATE "users" SET "role" = 'workspace_admin' WHERE "role" = 'admin';
UPDATE "users" SET "role" = 'workspace_admin' WHERE "role" = 'owner';

-- Step 2: Update the default value for new users
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

-- Migration complete
-- New role system:
--   'user' - regular user (formerly 'member')
--   'workspace_admin' - organization admin (formerly 'admin' or 'owner')
--   'superadmin' - platform superadmin (new, requires SUPERADMIN_EMAIL allowlist)
