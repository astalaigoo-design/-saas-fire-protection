CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'sent', 'accepted', 'declined');

CREATE TABLE "quotes" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "inspectionId" TEXT NOT NULL,
  "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
  "title" TEXT,
  "notes" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_line_items" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "quote_line_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quotes_inspectionId_key" ON "quotes"("inspectionId");
CREATE INDEX "quotes_companyId_status_idx" ON "quotes"("companyId", "status");
CREATE INDEX "quote_line_items_quoteId_idx" ON "quote_line_items"("quoteId");

ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_inspectionId_fkey"
  FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quote_line_items"
  ADD CONSTRAINT "quote_line_items_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "quotes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
