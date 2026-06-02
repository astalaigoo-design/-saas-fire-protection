-- CreateTable
CREATE TABLE "building_notes" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "building_notes_buildingId_idx" ON "building_notes"("buildingId");

-- AddForeignKey
ALTER TABLE "building_notes" ADD CONSTRAINT "building_notes_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
