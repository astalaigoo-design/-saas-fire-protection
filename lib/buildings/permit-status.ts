/** Days before permit expiry to flag as expiring soon (AHJ renewals). */
export const PERMIT_EXPIRING_SOON_DAYS = 60;

export type PermitStatus =
  | "missing"
  | "expired"
  | "expiring_soon"
  | "current"
  | "no_expiry_date";

export type PermitStatusInput = {
  permitNumber: string | null | undefined;
  permitExpiresAt: Date | null | undefined;
  now?: Date;
};

export function computePermitStatus(input: PermitStatusInput): PermitStatus {
  const permitNumber = input.permitNumber?.trim() || null;
  const expiresAt = input.permitExpiresAt ?? null;

  if (!permitNumber && !expiresAt) return "missing";
  if (!expiresAt) return "no_expiry_date";

  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const expiryDay = startOfDay(expiresAt);

  if (expiryDay.getTime() < today.getTime()) return "expired";

  const soonCutoff = addDays(today, PERMIT_EXPIRING_SOON_DAYS);
  if (expiryDay.getTime() <= soonCutoff.getTime()) return "expiring_soon";

  return "current";
}

export function permitStatusLabel(status: PermitStatus): string {
  switch (status) {
    case "missing":
      return "AHJ not on file";
    case "expired":
      return "Permit expired";
    case "expiring_soon":
      return "Permit expiring soon";
    case "no_expiry_date":
      return "No expiry date";
    case "current":
      return "Permit current";
  }
}

export function permitStatusNeedsAttention(status: PermitStatus): boolean {
  return (
    status === "missing" ||
    status === "expired" ||
    status === "expiring_soon" ||
    status === "no_expiry_date"
  );
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
