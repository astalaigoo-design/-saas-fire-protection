import { AssetType } from "@prisma/client";
import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value));

export const buildingAssetIdSchema = z.object({
  assetId: z.string().cuid("Invalid asset."),
  buildingId: z.string().cuid("Invalid building."),
});

const assetFieldsSchema = z.object({
  buildingId: z.string().cuid("Invalid building."),
  assetType: z.nativeEnum(AssetType),
  tagNumber: z.string().trim().max(80).optional().or(z.literal("")),
  location: z.string().trim().min(1, "Location is required").max(200),
  manufacturer: z.string().trim().max(120).optional().or(z.literal("")),
  model: z.string().trim().max(120).optional().or(z.literal("")),
  serialNumber: z.string().trim().max(120).optional().or(z.literal("")),
  lastServiceAt: optionalDate,
  nextServiceDue: optionalDate,
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const createBuildingAssetSchema = assetFieldsSchema;

export const updateBuildingAssetSchema = assetFieldsSchema.extend({
  assetId: z.string().cuid("Invalid asset."),
});

export type CreateBuildingAssetInput = z.infer<typeof createBuildingAssetSchema>;
export type UpdateBuildingAssetInput = z.infer<typeof updateBuildingAssetSchema>;
