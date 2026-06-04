-- CreateEnum
CREATE TYPE "IntegrationWebhookEvent" AS ENUM ('inspection_completed', 'report_finalized', 'quote_updated', 'deficiency_created');

-- CreateTable
CREATE TABLE "company_api_keys" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'API key',
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_webhook_endpoints" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Webhook',
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" "IntegrationWebhookEvent"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_api_keys_keyHash_key" ON "company_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "company_api_keys_companyId_idx" ON "company_api_keys"("companyId");

-- CreateIndex
CREATE INDEX "company_webhook_endpoints_companyId_idx" ON "company_webhook_endpoints"("companyId");

-- AddForeignKey
ALTER TABLE "company_api_keys" ADD CONSTRAINT "company_api_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_webhook_endpoints" ADD CONSTRAINT "company_webhook_endpoints_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
