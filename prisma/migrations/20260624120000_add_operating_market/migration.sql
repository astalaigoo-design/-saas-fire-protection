-- CreateEnum
CREATE TYPE "OperatingMarket" AS ENUM ('US', 'UK');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN "operatingMarket" "OperatingMarket" NOT NULL DEFAULT 'US';
