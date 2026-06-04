-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" TEXT NOT NULL,
    "inspectionTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_template_items_inspectionTypeId_idx" ON "checklist_template_items"("inspectionTypeId");

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_inspectionTypeId_fkey" FOREIGN KEY ("inspectionTypeId") REFERENCES "inspection_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
