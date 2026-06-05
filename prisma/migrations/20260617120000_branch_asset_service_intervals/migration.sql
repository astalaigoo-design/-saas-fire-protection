-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE 'fire_hydrant';
ALTER TYPE "AssetType" ADD VALUE 'standpipe';

-- CreateTable
CREATE TABLE "branch_asset_service_intervals" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "intervalMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_asset_service_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branch_asset_service_intervals_branchId_idx" ON "branch_asset_service_intervals"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "branch_asset_service_intervals_branchId_assetType_key" ON "branch_asset_service_intervals"("branchId", "assetType");

-- AddForeignKey
ALTER TABLE "branch_asset_service_intervals" ADD CONSTRAINT "branch_asset_service_intervals_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill default water-system test intervals per branch
INSERT INTO "branch_asset_service_intervals" ("id", "branchId", "assetType", "intervalMonths", "createdAt", "updatedAt")
SELECT
    'bas_' || substr(md5(b."id" || ':fire_hydrant'), 1, 22),
    b."id",
    'fire_hydrant'::"AssetType",
    12,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "branches" b;

INSERT INTO "branch_asset_service_intervals" ("id", "branchId", "assetType", "intervalMonths", "createdAt", "updatedAt")
SELECT
    'bas_' || substr(md5(b."id" || ':standpipe'), 1, 22),
    b."id",
    'standpipe'::"AssetType",
    12,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "branches" b;

INSERT INTO "branch_asset_service_intervals" ("id", "branchId", "assetType", "intervalMonths", "createdAt", "updatedAt")
SELECT
    'bas_' || substr(md5(b."id" || ':sprinkler_component'), 1, 22),
    b."id",
    'sprinkler_component'::"AssetType",
    3,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "branches" b;
