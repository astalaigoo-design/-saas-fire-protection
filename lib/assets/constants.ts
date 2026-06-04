import { AssetType } from "@prisma/client";

export const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: AssetType.fire_extinguisher, label: "Fire extinguisher" },
  { value: AssetType.fire_alarm_panel, label: "Fire alarm panel" },
  { value: AssetType.sprinkler_component, label: "Sprinkler / riser" },
  { value: AssetType.emergency_light, label: "Emergency light" },
  { value: AssetType.hose_cabinet, label: "Hose cabinet" },
  { value: AssetType.other, label: "Other equipment" },
];

export function assetTypeLabel(type: AssetType): string {
  return ASSET_TYPES.find((row) => row.value === type)?.label ?? type;
}
