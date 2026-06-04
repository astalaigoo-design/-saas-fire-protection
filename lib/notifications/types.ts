export const STAFF_NOTIFICATION_TYPES = [
  "quote.accepted",
  "quote.declined",
  "quote.changes_requested",
  "inspection.scheduled",
  "inspection.assigned",
  "report.email_failed",
] as const;

export type StaffNotificationType = (typeof STAFF_NOTIFICATION_TYPES)[number];

export type CreateStaffNotificationInput = {
  companyId: string;
  type: StaffNotificationType;
  title: string;
  body: string;
  href?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  targetUserId?: string | null;
  /** When true, email active owners/admins if Resend is configured. */
  emailOwnersAndAdmins?: boolean;
};
