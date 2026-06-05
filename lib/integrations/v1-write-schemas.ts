import { z } from "zod";
import { recurrenceFormValues } from "@/lib/scheduling/schemas";

const optionalEmail = z
  .string()
  .trim()
  .max(320)
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Invalid email.",
  });

const optionalPhone = z
  .string()
  .trim()
  .max(50)
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value));

export const v1CreateCustomerBuildingSchema = z.object({
  name: z.string().trim().max(200).optional(),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(50),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().length(2).default("US"),
});

export const v1CreateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: optionalEmail,
    phone: optionalPhone,
    branchId: z.string().trim().min(1).optional(),
    externalRef: z.string().trim().max(200).optional(),
    building: v1CreateCustomerBuildingSchema.optional(),
  })
  .strict();

export type V1CreateCustomerInput = z.infer<typeof v1CreateCustomerSchema>;

export const v1CreateInspectionSchema = z
  .object({
    buildingId: z.string().trim().min(1),
    inspectionTypeId: z.string().trim().min(1).optional(),
    inspectionTypeCode: z.string().trim().min(1).max(80).optional(),
    scheduledAt: z.string().trim().min(1),
    assignedToUserId: z.string().trim().min(1).optional(),
    recurrence: z.enum(recurrenceFormValues).default("none"),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
    externalRef: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine((data) => Boolean(data.inspectionTypeId || data.inspectionTypeCode), {
    message: "Provide inspectionTypeId or inspectionTypeCode.",
  });

export type V1CreateInspectionInput = z.infer<typeof v1CreateInspectionSchema>;
