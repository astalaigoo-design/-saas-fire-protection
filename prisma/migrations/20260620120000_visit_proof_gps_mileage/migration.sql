-- Time on site, GPS check-in/submit coordinates, and mileage per visit

ALTER TABLE "inspections"
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "arrivedAt" TIMESTAMP(3),
ADD COLUMN "arrivalLatitude" DOUBLE PRECISION,
ADD COLUMN "arrivalLongitude" DOUBLE PRECISION,
ADD COLUMN "arrivalAccuracyMeters" DOUBLE PRECISION,
ADD COLUMN "submitLatitude" DOUBLE PRECISION,
ADD COLUMN "submitLongitude" DOUBLE PRECISION,
ADD COLUMN "submitAccuracyMeters" DOUBLE PRECISION,
ADD COLUMN "mileageMiles" DOUBLE PRECISION;
