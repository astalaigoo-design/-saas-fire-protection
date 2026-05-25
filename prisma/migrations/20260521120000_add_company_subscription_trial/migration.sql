-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'expired');

-- AlterTable
ALTER TABLE "companies"
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
ADD COLUMN "lemonSqueezyCustomerId" TEXT,
ADD COLUMN "lemonSqueezySubscriptionId" TEXT,
ADD COLUMN "subscriptionRenewsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "companies_lemonSqueezySubscriptionId_key" ON "companies"("lemonSqueezySubscriptionId");

-- Existing tenants keep full access (grandfathered before self-serve billing).
UPDATE "companies"
SET "subscriptionStatus" = 'active', "trialEndsAt" = NULL;
