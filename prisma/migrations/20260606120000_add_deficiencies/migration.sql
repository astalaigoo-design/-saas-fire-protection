-- CreateEnum
CREATE TYPE "DeficiencyStatus" AS ENUM ('open', 'owned', 'resolved', 'verified');

-- CreateTable
CREATE TABLE "deficiencies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "inspectionItemId" TEXT NOT NULL,
    "sourceInspectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "status" "DeficiencyStatus" NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedInspectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deficiencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deficiencies_inspectionItemId_key" ON "deficiencies"("inspectionItemId");

-- CreateIndex
CREATE INDEX "deficiencies_companyId_status_idx" ON "deficiencies"("companyId", "status");

-- CreateIndex
CREATE INDEX "deficiencies_buildingId_status_idx" ON "deficiencies"("buildingId", "status");

-- CreateIndex
CREATE INDEX "deficiencies_assignedToUserId_idx" ON "deficiencies"("assignedToUserId");

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_inspectionItemId_fkey" FOREIGN KEY ("inspectionItemId") REFERENCES "inspection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_sourceInspectionId_fkey" FOREIGN KEY ("sourceInspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_verifiedInspectionId_fkey" FOREIGN KEY ("verifiedInspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
