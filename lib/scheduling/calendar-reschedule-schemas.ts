import { z } from "zod";

export const dragRescheduleInspectionSchema = z.object({
  inspectionId: z.string().cuid("Invalid inspection."),
  targetDate: z.string().trim().min(1, "Enter a date."),
});

export const bulkRescheduleInspectionsSchema = z.object({
  inspectionIds: z
    .array(z.string().cuid("Invalid inspection."))
    .min(1, "Select at least one job.")
    .max(50, "Select at most 50 jobs at a time."),
  targetDate: z.string().trim().min(1, "Enter a date."),
});
