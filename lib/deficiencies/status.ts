import { DeficiencyStatus } from "@prisma/client";

export const OPEN_DEFICIENCY_STATUSES: DeficiencyStatus[] = [
  DeficiencyStatus.open,
  DeficiencyStatus.owned,
  DeficiencyStatus.resolved,
];

export const DEFICIENCY_STATUS_LABELS: Record<DeficiencyStatus, string> = {
  [DeficiencyStatus.open]: "Open",
  [DeficiencyStatus.owned]: "Owned",
  [DeficiencyStatus.resolved]: "Resolved",
  [DeficiencyStatus.verified]: "Verified",
};

export function isOpenDeficiencyStatus(status: DeficiencyStatus): boolean {
  return OPEN_DEFICIENCY_STATUSES.includes(status);
}
