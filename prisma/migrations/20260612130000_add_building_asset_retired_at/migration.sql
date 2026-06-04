-- When an asset was removed from the active register (soft retire).
ALTER TABLE "building_assets" ADD COLUMN "retiredAt" TIMESTAMP(3);
