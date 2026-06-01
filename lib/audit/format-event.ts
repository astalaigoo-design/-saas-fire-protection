import { auditActionLabel } from "@/lib/audit/labels";

export type AuditEventForDisplay = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
};

function asRecord(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  return metadata as Record<string, unknown>;
}

function metaString(meta: Record<string, unknown> | null, key: string): string | null {
  const value = meta?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function formatAuditEventSummary(event: AuditEventForDisplay): string {
  const meta = asRecord(event.metadata);

  switch (event.action) {
    case "inspection.submitted":
      return metaString(meta, "buildingId")
        ? "Inspection completed and signed"
        : "Inspection completed";
    case "inspection.auto_scheduled": {
      const at = metaString(meta, "scheduledAt");
      const cadence = metaString(meta, "cadence");
      if (at && cadence) return `Next ${cadence} visit scheduled for ${formatIsoDate(at)}`;
      if (at) return `Next visit scheduled for ${formatIsoDate(at)}`;
      return "Next recurring visit scheduled";
    }
    case "inspection.follow_up_scheduled": {
      const at = metaString(meta, "scheduledAt");
      const days = meta?.followUpDays;
      if (at && typeof days === "number") {
        return `Follow-up in ${days} days (${formatIsoDate(at)})`;
      }
      if (at) return `Follow-up scheduled for ${formatIsoDate(at)}`;
      return "Follow-up scheduled after failed items";
    }
    case "inspection.scheduled_from_quote": {
      const at = metaString(meta, "scheduledAt");
      const kind = metaString(meta, "visitKind");
      const days = meta?.daysOut;
      const label =
        kind === "reinspection"
          ? "Re-inspection"
          : kind === "repair"
            ? "Repair visit"
            : "Job";
      if (at && typeof days === "number") {
        return `${label} in ${days} days (${formatIsoDate(at)})`;
      }
      if (at) return `${label} scheduled for ${formatIsoDate(at)}`;
      return `${label} scheduled from accepted quote`;
    }
    case "inspection.due_reminder_sent": {
      const type = metaString(meta, "inspectionTypeName");
      const due = metaString(meta, "dueAt");
      const to = metaString(meta, "sentTo");
      const parts = [
        type ? `${type} due` : "Inspection due",
        due ? formatIsoDate(due) : null,
        to ? `emailed ${to}` : null,
      ].filter(Boolean);
      return parts.join(" · ") || "Due-date reminder emailed";
    }
    case "building.created":
      return metaString(meta, "customerId")
        ? "New site added for customer"
        : "New building added";
    case "customer.created":
      return metaString(meta, "name")
        ? `Customer “${metaString(meta, "name")}” added`
        : "New customer added";
    case "quote.sent": {
      const to = metaString(meta, "sentTo");
      return to ? `Quote emailed to ${to}` : "Repair quote sent to customer";
    }
    case "quote.accepted": {
      const building = metaString(meta, "buildingLabel");
      return building ? `Customer accepted quote · ${building}` : "Customer accepted quote";
    }
    case "quote.declined": {
      const building = metaString(meta, "buildingLabel");
      return building ? `Customer declined quote · ${building}` : "Customer declined quote";
    }
    case "quote.changes_requested": {
      const building = metaString(meta, "buildingLabel");
      const preview = metaString(meta, "messagePreview");
      if (building && preview) return `Change request · ${building}: ${preview}`;
      if (building) return `Customer requested changes · ${building}`;
      return "Customer requested quote changes";
    }
    case "billing.trial_reminder_sent": {
      const days = meta?.daysBeforeEnd;
      const to = metaString(meta, "sentTo");
      if (typeof days === "number" && to) {
        return `Trial ends in ${days} day${days === 1 ? "" : "s"} — emailed ${to}`;
      }
      return "Trial ending reminder sent";
    }
    default:
      return auditActionLabel(event.action);
  }
}

function formatIsoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function auditEventHref(event: AuditEventForDisplay): string | null {
  if (!event.entityId) return null;

  switch (event.entityType) {
    case "inspection":
      return `/inspect/${event.entityId}`;
    case "building":
      return `/dashboard/buildings/${event.entityId}`;
    case "customer":
      return `/dashboard/customers/${event.entityId}`;
    case "quote":
      return "/dashboard/reports";
    case "company":
      return "/dashboard/settings";
    default:
      return null;
  }
}

export function auditEventLinkLabel(event: AuditEventForDisplay): string {
  switch (event.entityType) {
    case "inspection":
      return "Open inspection";
    case "building":
      return "View building";
    case "customer":
      return "View customer";
    case "quote":
      return "View reports";
    case "company":
      return "Organization";
    default:
      return "View";
  }
}
