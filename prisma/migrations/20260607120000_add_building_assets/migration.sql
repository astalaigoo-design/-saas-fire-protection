-- CreateEnum
CREATE TYPE "AssetType" AS ENUM (
  'fire_extinguisher',
  'fire_alarm_panel',
  'sprinkler_component',
  'emergency_light',
  'hose_cabinet',
  'other'
);

-- CreateTable
CREATE TABLE "building_assets" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "tagNumber" TEXT,
    "location" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "lastServiceAt" TIMESTAMP(3),
    "nextServiceDue" TIMESTAMP(3),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "building_assets_buildingId_active_idx" ON "building_assets"("buildingId", "active");

-- AddForeignKey
ALTER TABLE "building_assets" ADD CONSTRAINT "building_assets_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
