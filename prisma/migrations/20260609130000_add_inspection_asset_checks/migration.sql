-- Per-asset field results tied to an inspection visit.
CREATE TABLE "inspection_asset_checks" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "buildingAssetId" TEXT NOT NULL,
    "result" "InspectionItemResult" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "servicedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_asset_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inspection_asset_checks_inspectionId_buildingAssetId_key" ON "inspection_asset_checks"("inspectionId", "buildingAssetId");
CREATE INDEX "inspection_asset_checks_inspectionId_idx" ON "inspection_asset_checks"("inspectionId");
CREATE INDEX "inspection_asset_checks_buildingAssetId_idx" ON "inspection_asset_checks"("buildingAssetId");

ALTER TABLE "inspection_asset_checks" ADD CONSTRAINT "inspection_asset_checks_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_asset_checks" ADD CONSTRAINT "inspection_asset_checks_buildingAssetId_fkey" FOREIGN KEY ("buildingAssetId") REFERENCES "building_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
