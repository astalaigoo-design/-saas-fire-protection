/** Known audit actions — extend as new events are instrumented. */
export const AUDIT_ACTIONS = [
  "inspection.submitted",
  "inspection.scheduled",
  "inspection.auto_scheduled",
  "inspection.follow_up_scheduled",
  "inspection.scheduled_from_quote",
  "inspection.due_reminder_sent",
  "automation.due_reminders_run",
  "automation.trial_reminders_run",
  "building.created",
  "customer.created",
  "customer.branch_reassigned",
  "quote.sent",
  "quote.accepted",
  "quote.declined",
  "quote.changes_requested",
  "billing.trial_reminder_sent",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  "inspection",
  "building",
  "customer",
  "quote",
  "company",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

const ACTION_LABELS: Record<string, string> = {
  "inspection.submitted": "Inspection submitted",
  "inspection.scheduled": "Inspection scheduled",
  "inspection.auto_scheduled": "Recurring job auto-scheduled",
  "inspection.follow_up_scheduled": "Follow-up job scheduled",
  "inspection.scheduled_from_quote": "Job scheduled from accepted quote",
  "inspection.due_reminder_sent": "Due-date reminder sent",
  "automation.due_reminders_run": "Due reminder check",
  "automation.trial_reminders_run": "Trial reminder check",
  "building.created": "Building created",
  "customer.created": "Customer created",
  "customer.branch_reassigned": "Customer moved to another branch",
  "quote.sent": "Repair quote sent",
  "quote.accepted": "Quote accepted",
  "quote.declined": "Quote declined",
  "quote.changes_requested": "Customer requested quote changes",
  "billing.trial_reminder_sent": "Trial ending reminder sent",
};

const ENTITY_LABELS: Record<string, string> = {
  inspection: "Inspection",
  building: "Building",
  customer: "Customer",
  quote: "Quote",
  company: "Company",
};

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/\./g, " · ");
}

export function auditEntityTypeLabel(entityType: string | null): string {
  if (!entityType) return "—";
  return ENTITY_LABELS[entityType] ?? entityType;
}

export const AUDIT_ACTION_FILTER_OPTIONS = [
  { value: "", label: "All actions" },
  ...AUDIT_ACTIONS.map((action) => ({
    value: action,
    label: ACTION_LABELS[action] ?? action,
  })),
];

export const AUDIT_ENTITY_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  ...AUDIT_ENTITY_TYPES.map((entityType) => ({
    value: entityType,
    label: ENTITY_LABELS[entityType] ?? entityType,
  })),
];
