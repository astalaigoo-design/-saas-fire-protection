-- AlterTable
ALTER TABLE "branches" ADD COLUMN "defaultAssetType" "AssetType";
ALTER TABLE "branches" ADD COLUMN "defaultServiceIntervalMonths" INTEGER;
ALTER TABLE "branches" ADD COLUMN "isImportDefault" BOOLEAN NOT NULL DEFAULT false;
