-- AlterTable
ALTER TABLE "inspections" ADD COLUMN "signatureData" TEXT,
ADD COLUMN "signedAt" TIMESTAMP(3),
ADD COLUMN "submittedByUserId" TEXT;
