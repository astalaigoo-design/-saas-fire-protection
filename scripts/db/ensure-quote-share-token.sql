ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "quotes_shareToken_key" ON "quotes"("shareToken");
