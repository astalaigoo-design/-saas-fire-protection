import { DeficiencyStatus } from "@prisma/client";
import { z } from "zod";

export const deficiencyIdSchema = z.object({
  deficiencyId: z.string().cuid("Invalid deficiency."),
});

export const assignDeficiencySchema = z.object({
  deficiencyId: z.string().cuid("Invalid deficiency."),
  assignedToUserId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const updateDeficiencyDueSchema = z.object({
  deficiencyId: z.string().cuid("Invalid deficiency."),
  dueDate: z.string().trim().min(1, "Enter a due date."),
});

export const updateDeficiencyStatusSchema = z.object({
  deficiencyId: z.string().cuid("Invalid deficiency."),
  status: z.nativeEnum(DeficiencyStatus),
  resolvedNote: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});
