-- CreateEnum
CREATE TYPE "RecurrenceInterval" AS ENUM ('monthly', 'quarterly', 'annual');

-- AlterTable
ALTER TABLE "inspections" ADD COLUMN "recurrenceGroupId" TEXT,
ADD COLUMN "recurrenceInterval" "RecurrenceInterval";

-- CreateIndex
CREATE INDEX "inspections_recurrenceGroupId_idx" ON "inspections"("recurrenceGroupId");
