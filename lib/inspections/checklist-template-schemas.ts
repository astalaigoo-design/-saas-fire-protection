import { z } from "zod";

export const checklistTemplateItemIdSchema = z.object({
  itemId: z.string().cuid("Invalid checklist item."),
});

export const checklistTemplateTypeIdSchema = z.object({
  inspectionTypeId: z.string().cuid("Invalid inspection type."),
});

export const addChecklistTemplateItemSchema = z.object({
  inspectionTypeId: z.string().cuid("Invalid inspection type."),
  label: z
    .string()
    .trim()
    .min(1, "Enter a label.")
    .max(500, "Label is too long."),
  description: z
    .string()
    .trim()
    .max(4000, "Description is too long.")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const updateChecklistTemplateItemSchema = z.object({
  itemId: z.string().cuid("Invalid checklist item."),
  label: z
    .string()
    .trim()
    .min(1, "Enter a label.")
    .max(500, "Label is too long."),
  description: z
    .string()
    .trim()
    .max(4000, "Description is too long.")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const reorderChecklistTemplateItemSchema = z.object({
  itemId: z.string().cuid("Invalid checklist item."),
  direction: z.enum(["up", "down"]),
});
