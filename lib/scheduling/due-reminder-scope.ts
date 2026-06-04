/**
 * Scheduled due-reminder cron runs per **company**, not per branch.
 * Do not apply `branchScopeFromSession` or `User.branchId` filters here — owners
 * and all company admins should see the full compliance picture in reminder emails.
 */

export function dueReminderBuildingWhere(companyId: string) {
  return { customer: { companyId } } as const;
}

export function dueReminderInspectionWhere(companyId: string) {
  return { companyId } as const;
}

export function dueReminderInspectionTypeWhere(companyId: string) {
  return { companyId } as const;
}
