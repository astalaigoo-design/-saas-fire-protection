-- Jurisdiction entity + certificate numbering on compliance reports

CREATE TABLE "jurisdictions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "certificatePrefix" TEXT,
    "nextCertificateNumber" INTEGER NOT NULL DEFAULT 1,
    "reportTemplateKey" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "jurisdictions_companyId_code_key" ON "jurisdictions"("companyId", "code");
CREATE INDEX "jurisdictions_companyId_idx" ON "jurisdictions"("companyId");

ALTER TABLE "jurisdictions"
ADD CONSTRAINT "jurisdictions_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "companies"
ADD COLUMN "certificateNumberPrefix" TEXT,
ADD COLUMN "nextCertificateNumber" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "buildings"
ADD COLUMN "jurisdictionId" TEXT;

CREATE INDEX "buildings_jurisdictionId_idx" ON "buildings"("jurisdictionId");

ALTER TABLE "buildings"
ADD CONSTRAINT "buildings_jurisdictionId_fkey"
FOREIGN KEY ("jurisdictionId") REFERENCES "jurisdictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reports"
ADD COLUMN "companyId" TEXT,
ADD COLUMN "certificateNumber" TEXT,
ADD COLUMN "reportTemplateKey" TEXT;

UPDATE "reports" AS r
SET "companyId" = i."companyId"
FROM "inspections" AS i
WHERE i."id" = r."inspectionId";

ALTER TABLE "reports"
ALTER COLUMN "companyId" SET NOT NULL;

CREATE INDEX "reports_companyId_idx" ON "reports"("companyId");
CREATE UNIQUE INDEX "reports_companyId_certificateNumber_key"
ON "reports"("companyId", "certificateNumber");

ALTER TABLE "reports"
ADD CONSTRAINT "reports_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
