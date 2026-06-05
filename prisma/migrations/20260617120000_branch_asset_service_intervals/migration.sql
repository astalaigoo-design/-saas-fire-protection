-- prisma-migrate-disable-transaction
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'fire_hydrant';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'standpipe';
