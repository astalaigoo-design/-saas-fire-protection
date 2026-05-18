import { BuildingType } from "@prisma/client";

export const BUILDING_TYPES = [
  { value: BuildingType.commercial, label: "Commercial" },
  { value: BuildingType.residential, label: "Residential" },
  { value: BuildingType.industrial, label: "Industrial" },
  { value: BuildingType.mixed, label: "Mixed" },
  { value: BuildingType.other, label: "Other" },
] as const;

export function buildingTypeLabel(
  value: BuildingType | string | null | undefined,
): string {
  if (!value) return "Not specified";
  const match = BUILDING_TYPES.find((t) => t.value === value);
  return match?.label ?? String(value).replace(/_/g, " ");
}
