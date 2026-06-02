CREATE TABLE IF NOT EXISTS "idempotency_keys" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "method" TEXT,
    "path" TEXT,
    "requestHash" TEXT,
    "status" INTEGER NOT NULL,
    "body" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_keys_cacheKey_key"
ON "idempotency_keys"("cacheKey");

CREATE INDEX IF NOT EXISTS "idempotency_keys_expiresAt_idx"
ON "idempotency_keys"("expiresAt");

ALTER TABLE "idempotency_keys" ADD COLUMN IF NOT EXISTS "method" TEXT;
ALTER TABLE "idempotency_keys" ADD COLUMN IF NOT EXISTS "path" TEXT;

