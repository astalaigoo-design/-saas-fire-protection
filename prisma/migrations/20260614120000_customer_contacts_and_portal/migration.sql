-- CreateEnum
CREATE TYPE "CustomerContactRole" AS ENUM ('billing', 'site');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "portalToken" TEXT;
ALTER TABLE "customers" ADD COLUMN "portalEnabledAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "customers_portalToken_key" ON "customers"("portalToken");

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "CustomerContactRole" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_role_idx" ON "customer_contacts"("customerId", "role");

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
