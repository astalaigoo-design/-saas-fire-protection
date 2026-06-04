-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "inspections" ADD COLUMN "technicianDayOfSmsSentAt" TIMESTAMP(3);
