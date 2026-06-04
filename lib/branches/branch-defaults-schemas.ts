import { AssetType } from "@prisma/client";
import { z } from "zod";

export const updateBranchDefaultsSchema = z.object({
  branchId: z.string().cuid("Invalid branch."),
  defaultAssetType: z
    .union([z.nativeEnum(AssetType), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  defaultServiceIntervalMonths: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v) return null;
      const n = Number.parseInt(v, 10);
      if (!Number.isInteger(n) || n < 1 || n > 60) return "invalid" as const;
      return n;
    }),
  isImportDefault: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true" || v === "1"),
});
