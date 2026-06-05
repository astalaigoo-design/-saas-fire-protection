import { z } from "zod";
import { REPORT_TEMPLATE_KEYS } from "@/lib/reports/templates/types";

export const jurisdictionCodeSchema = z
  .string()
  .trim()
  .min(2, "Code must be at least 2 characters.")
  .max(20)
  .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores.");

export const upsertJurisdictionSchema = z.object({
  jurisdictionId: z.string().trim().optional(),
  name: z.string().trim().min(2, "Name is required.").max(120),
  code: jurisdictionCodeSchema,
  certificatePrefix: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  reportTemplateKey: z.enum(REPORT_TEMPLATE_KEYS).default("default"),
});

export type UpsertJurisdictionInput = z.infer<typeof upsertJurisdictionSchema>;
