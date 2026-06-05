import { AssetType } from "@prisma/client";

export const WATER_SYSTEM_ASSET_TYPES = [
  AssetType.fire_hydrant,
  AssetType.standpipe,
  AssetType.sprinkler_component,
] as const;

export const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: AssetType.fire_extinguisher, label: "Fire extinguisher" },
  { value: AssetType.fire_alarm_panel, label: "Fire alarm panel" },
  { value: AssetType.fire_hydrant, label: "Fire hydrant" },
  { value: AssetType.standpipe, label: "Standpipe" },
  { value: AssetType.sprinkler_component, label: "Sprinkler / riser" },
  { value: AssetType.emergency_light, label: "Emergency light" },
  { value: AssetType.hose_cabinet, label: "Hose cabinet" },
  { value: AssetType.other, label: "Other equipment" },
];

export function waterSystemAssetTypeLabel(assetType: AssetType): string {
  switch (assetType) {
    case AssetType.fire_hydrant:
      return "Hydrant tests";
    case AssetType.standpipe:
      return "Standpipe tests";
    case AssetType.sprinkler_component:
      return "Sprinkler tests";
    default:
      return assetTypeLabel(assetType);
  }
}

export function assetTypeLabel(type: AssetType): string {
  return ASSET_TYPES.find((row) => row.value === type)?.label ?? type;
}
