export const BUILDING_TAB_VALUES = [
  "history",
  "assets",
  "deficiencies",
  "photos",
  "reports",
  "notes",
] as const;

export type BuildingTabValue = (typeof BUILDING_TAB_VALUES)[number];

export function resolveBuildingTab(tab: string | undefined): BuildingTabValue {
  if (tab && BUILDING_TAB_VALUES.includes(tab as BuildingTabValue)) {
    return tab as BuildingTabValue;
  }
  return "history";
}
