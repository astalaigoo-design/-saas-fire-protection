import { z } from "zod";

export const recurrenceFormValues = ["none", "monthly", "quarterly", "annual"] as const;

export const scheduleInspectionSchema = z.object({
  buildingId: z.string().trim().min(1, "Select a building"),
  inspectionTypeId: z.string().trim().min(1, "Select an inspection type"),
  assignedToUserId: z.string().trim().optional(),
  scheduledDate: z.string().trim().min(1, "Date is required"),
  scheduledTime: z.string().trim().min(1, "Time is required"),
  recurrence: z.enum(recurrenceFormValues).default("none"),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type ScheduleInspectionInput = z.infer<typeof scheduleInspectionSchema>;
