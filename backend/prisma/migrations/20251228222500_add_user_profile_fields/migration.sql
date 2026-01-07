-- AlterTable: Add business profile fields to users
ALTER TABLE "users" 
  ADD COLUMN "full_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "company_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "title" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_verify_token" TEXT,
  ADD COLUMN "email_verify_expires" TIMESTAMP(3),
  ADD COLUMN "last_login_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verify_token_key" ON "users"("email_verify_token");

-- CreateIndex
CREATE INDEX "users_email_verified_idx" ON "users"("email_verified");
