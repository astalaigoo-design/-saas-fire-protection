-- Optional columns from prior schema iterations
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "fireDistrict" TEXT;
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "generalNotes" TEXT;

CREATE TYPE "BuildingType" AS ENUM ('commercial', 'residential', 'industrial', 'mixed', 'other');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'buildings'
      AND column_name = 'buildingType'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "buildings" ADD COLUMN "buildingType_enum" "BuildingType";

    UPDATE "buildings"
    SET "buildingType_enum" = CASE "buildingType"
      WHEN 'commercial' THEN 'commercial'::"BuildingType"
      WHEN 'residential' THEN 'residential'::"BuildingType"
      WHEN 'industrial' THEN 'industrial'::"BuildingType"
      WHEN 'mixed' THEN 'mixed'::"BuildingType"
      WHEN 'mixed_use' THEN 'mixed'::"BuildingType"
      WHEN 'other' THEN 'other'::"BuildingType"
      WHEN 'institutional' THEN 'other'::"BuildingType"
      ELSE NULL
    END
    WHERE "buildingType" IS NOT NULL;

    ALTER TABLE "buildings" DROP COLUMN "buildingType";
    ALTER TABLE "buildings" RENAME COLUMN "buildingType_enum" TO "buildingType";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'buildings'
      AND column_name = 'buildingType'
  ) THEN
    ALTER TABLE "buildings" ADD COLUMN "buildingType" "BuildingType";
  END IF;
END $$;

CREATE TYPE "ComplianceStatus" AS ENUM ('PASS', 'FAIL', 'PENDING', 'OVERDUE');

ALTER TABLE "buildings"
ADD COLUMN IF NOT EXISTS "currentStatus" "ComplianceStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS "buildings_currentStatus_idx" ON "buildings"("currentStatus");
