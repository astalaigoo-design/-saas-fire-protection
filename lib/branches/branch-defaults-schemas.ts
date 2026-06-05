import { AssetType } from "@prisma/client";
import { z } from "zod";
import { WATER_SYSTEM_ASSET_TYPES } from "@/lib/assets/constants";

function parseIntervalMonthsField(value: string | undefined) {
  if (!value?.trim()) return null;
  const n = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(n) || n < 1 || n > 60) return "invalid" as const;
  return n;
}

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
  serviceInterval_fire_hydrant: z.string().trim().optional(),
  serviceInterval_standpipe: z.string().trim().optional(),
  serviceInterval_sprinkler_component: z.string().trim().optional(),
});

export type ParsedBranchServiceIntervals = {
  assetType: (typeof WATER_SYSTEM_ASSET_TYPES)[number];
  intervalMonths: number;
}[];

export function parseWaterSystemServiceIntervals(
  data: z.infer<typeof updateBranchDefaultsSchema>,
): ParsedBranchServiceIntervals | "invalid" {
  const entries: ParsedBranchServiceIntervals = [];
  const fields: { key: keyof typeof data; assetType: (typeof WATER_SYSTEM_ASSET_TYPES)[number] }[] =
    [
      { key: "serviceInterval_fire_hydrant", assetType: AssetType.fire_hydrant },
      { key: "serviceInterval_standpipe", assetType: AssetType.standpipe },
      {
        key: "serviceInterval_sprinkler_component",
        assetType: AssetType.sprinkler_component,
      },
    ];

  for (const field of fields) {
    const parsed = parseIntervalMonthsField(data[field.key] as string | undefined);
    if (parsed === "invalid") return "invalid";
    if (parsed != null) {
      entries.push({ assetType: field.assetType, intervalMonths: parsed });
    }
  }

  return entries;
}
