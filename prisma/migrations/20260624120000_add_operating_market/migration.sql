-- CreateEnum
CREATE TYPE "OperatingMarket" AS ENUM ('US', 'UK');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "operatingMarket" "OperatingMarket" NOT NULL DEFAULT 'US';
