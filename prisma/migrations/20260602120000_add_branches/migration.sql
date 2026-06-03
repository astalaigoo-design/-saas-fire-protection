-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_companyId_idx" ON "branches"("companyId");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default branch per company + backfill customers
INSERT INTO "branches" ("id", "companyId", "name", "isDefault", "createdAt", "updatedAt")
SELECT
    'br_' || substr(md5(c."id" || ':default'), 1, 22),
    c."id",
    'Main',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "companies" c;

ALTER TABLE "customers" ADD COLUMN "branchId" TEXT;

UPDATE "customers" cu
SET "branchId" = b."id"
FROM "branches" b
WHERE b."companyId" = cu."companyId" AND b."isDefault" = true;

ALTER TABLE "customers" ALTER COLUMN "branchId" SET NOT NULL;

CREATE INDEX "customers_branchId_idx" ON "customers"("branchId");

ALTER TABLE "customers" ADD CONSTRAINT "customers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Users: owners stay company-wide; others get default branch
ALTER TABLE "users" ADD COLUMN "branchId" TEXT;

UPDATE "users" u
SET "branchId" = b."id"
FROM "branches" b
WHERE b."companyId" = u."companyId"
  AND b."isDefault" = true
  AND u."role" <> 'owner';

CREATE INDEX "users_branchId_idx" ON "users"("branchId");

ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
