-- AlterTable
ALTER TABLE "quotes" ADD COLUMN "scheduledInspectionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "quotes_scheduledInspectionId_key" ON "quotes"("scheduledInspectionId");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_scheduledInspectionId_fkey" FOREIGN KEY ("scheduledInspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
