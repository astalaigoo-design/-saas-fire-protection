export const COMMAND_CENTER_TAB_VALUES = [
  "overview",
  "equipment",
  "repairs",
  "deficiencies",
  "quotes",
  "activity",
] as const;

export type CommandCenterTab = (typeof COMMAND_CENTER_TAB_VALUES)[number];

export function resolveCommandCenterTab(tab: string | undefined): CommandCenterTab {
  if (tab && COMMAND_CENTER_TAB_VALUES.includes(tab as CommandCenterTab)) {
    return tab as CommandCenterTab;
  }
  return "overview";
}
