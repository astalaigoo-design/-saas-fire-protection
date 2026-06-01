-- AlterTable
ALTER TABLE "quotes" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "quotes_shareToken_key" ON "quotes"("shareToken");
