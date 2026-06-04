-- Link checklist rows to building equipment register by tag number.
ALTER TABLE "checklist_template_items" ADD COLUMN "linkedTagNumber" TEXT;
ALTER TABLE "inspection_items" ADD COLUMN "linkedTagNumber" TEXT;
