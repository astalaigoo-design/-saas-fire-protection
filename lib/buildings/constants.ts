export const BUILDING_TYPES = [
  { value: "commercial", label: "Commercial" },
  { value: "residential", label: "Residential" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed_use", label: "Mixed use" },
  { value: "institutional", label: "Institutional" },
  { value: "other", label: "Other" },
] as const;

export function buildingTypeLabel(value: string | null | undefined): string {
  if (!value) return "Not specified";
  const match = BUILDING_TYPES.find((t) => t.value === value);
  return match?.label ?? value.replace(/_/g, " ");
}
