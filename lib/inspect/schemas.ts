import { InspectionItemResult } from "@prisma/client";
import { z } from "zod";
import { gpsCoordinatesSchema, visitMileageSchema } from "@/lib/inspect/visit-proof";

export const checklistItemResultSchema = z.enum([
  InspectionItemResult.pass,
  InspectionItemResult.fail,
  InspectionItemResult.na,
]);

export const updateChecklistItemSchema = z.object({
  inspectionId: z.string().trim().min(1),
  itemId: z.string().trim().min(1),
  result: checklistItemResultSchema,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const updateInspectionAssetCheckSchema = z.object({
  inspectionId: z.string().trim().min(1),
  assetCheckId: z.string().trim().min(1),
  result: checklistItemResultSchema,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const bulkMarkSectionNaSchema = z.object({
  inspectionId: z.string().trim().min(1),
  sectionKey: z.enum(["nfpa-10", "nfpa-25", "nfpa-72", "nfpa-96", "nfpa-101", "other"]),
});

export const uploadPhotoSchema = z.object({
  inspectionId: z.string().trim().min(1),
  dataUrl: z
    .string()
    .min(1)
    .max(6_000_000)
    .refine(
      (value) => value.startsWith("data:image/"),
      "Invalid image data.",
    ),
  caption: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const submitInspectionSchema = z.object({
  inspectionId: z.string().trim().min(1),
  signatureData: z
    .string()
    .min(1)
    .max(500_000)
    .refine(
      (value) => value.startsWith("data:image/"),
      "Signature is required.",
    ),
  submitCoordinates: gpsCoordinatesSchema.optional(),
  mileageMiles: z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, visitMileageSchema),
});
