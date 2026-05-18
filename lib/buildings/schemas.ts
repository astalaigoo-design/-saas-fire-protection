import { z } from "zod";

export const buildingTypeValues = [
  "commercial",
  "residential",
  "industrial",
  "mixed_use",
  "institutional",
  "other",
] as const;

export const updateBuildingSchema = z.object({
  buildingId: z.string().trim().min(1),
  name: z.string().trim().max(200).optional().or(z.literal("")),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  region: z.string().trim().min(1, "State / region is required").max(50),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  country: z.string().trim().min(2).max(2).default("US"),
  buildingType: z.enum(buildingTypeValues).optional().or(z.literal("")),
  fireDistrict: z.string().trim().max(200).optional().or(z.literal("")),
  generalNotes: z.string().trim().max(10000).optional().or(z.literal("")),
});

export const addBuildingNoteSchema = z.object({
  buildingId: z.string().trim().min(1),
  body: z.string().trim().min(1, "Note cannot be empty").max(5000),
});

export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
export type AddBuildingNoteInput = z.infer<typeof addBuildingNoteSchema>;
