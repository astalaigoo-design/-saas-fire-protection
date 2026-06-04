import { z } from "zod";

export const updateInspectionJobSchema = z.object({
  inspectionId: z.string().cuid("Invalid inspection."),
  scheduledDate: z.string().trim().min(1, "Enter a date."),
  scheduledTime: z.string().trim().min(1, "Enter a time."),
  assignedToUserId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});
