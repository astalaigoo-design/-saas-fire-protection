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
    case "inspection.scheduled": {
      const count = meta?.occurrenceCount;
      if (typeof count === "number" && count > 1) {
        return `${count} recurring visits scheduled`;
      }
      return "Inspection scheduled";
    }
    case "inspection.rescheduled": {
      const at = metaString(meta, "scheduledAt");
      return at ? `Rescheduled to ${formatIsoDate(at)}` : "Inspection rescheduled";
    }
    case "inspection.assignee_changed":
      return "Job assignee updated";
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
      const to =
        metaString(meta, "sentTo") ??
        (Array.isArray(meta?.recipients) && typeof meta.recipients[0] === "string"
          ? meta.recipients[0]
          : null);
      const parts = [
        type ? `${type} due` : "Inspection due",
        due ? formatIsoDate(due) : null,
        to ? `emailed ${to}` : null,
      ].filter(Boolean);
      return parts.join(" · ") || "Due-date reminder emailed";
    }
    case "automation.due_reminders_run": {
      const sent = meta?.remindersSent;
      const lead = meta?.leadDays;
      if (typeof sent === "number" && typeof lead === "number") {
        return sent === 0
          ? `Daily check · 0 due in ${lead} days to email`
          : `Daily check · ${sent} due in ${lead} days emailed`;
      }
      return "Daily due-date reminder check";
    }
    case "automation.trial_reminders_run": {
      const sent = meta?.remindersSent;
      if (typeof sent === "number") {
        return sent === 0 ? "Trial reminder check · none sent" : `Trial reminder check · ${sent} sent`;
      }
      return "Trial ending reminder check";
    }
    case "building.created":
      return metaString(meta, "customerId")
        ? "New site added for customer"
        : "New building added";
    case "customer.created":
      return metaString(meta, "name")
        ? `Customer “${metaString(meta, "name")}” added`
        : "New customer added";
    case "customer.branch_reassigned": {
      const name = metaString(meta, "name");
      const branchName = metaString(meta, "branchName");
      if (name && branchName) return `“${name}” moved to ${branchName}`;
      if (branchName) return `Customer moved to ${branchName}`;
      return "Customer moved to another branch";
    }
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
    case "deficiency.created": {
      const label = metaString(meta, "label");
      return label ? `Deficiency opened · ${label}` : "Deficiency opened";
    }
    case "deficiency.assigned":
      return "Deficiency assignee updated";
    case "deficiency.status_changed": {
      const status = metaString(meta, "status");
      return status ? `Deficiency status → ${status}` : "Deficiency status updated";
    }
    case "deficiency.verified": {
      const label = metaString(meta, "label");
      return label ? `Verified on re-inspection · ${label}` : "Deficiency verified";
    }
    case "asset.created": {
      const location = metaString(meta, "location");
      return location ? `Equipment added · ${location}` : "Equipment added to register";
    }
    case "asset.updated":
      return "Equipment record updated";
    case "asset.retired": {
      const label = metaString(meta, "label");
      const tag = metaString(meta, "tagNumber");
      const location = metaString(meta, "location");
      const parts = [label, tag ? `tag ${tag}` : null, location].filter(Boolean);
      return parts.length > 0
        ? `Equipment removed · ${parts.join(" · ")}`
        : "Equipment removed from register";
    }
    case "billing.trial_reminder_sent": {
      const days =
        typeof meta?.daysBeforeEnd === "number"
          ? meta.daysBeforeEnd
          : typeof meta?.daysBefore === "number"
            ? meta.daysBefore
            : null;
      const to =
        metaString(meta, "sentTo") ??
        (Array.isArray(meta?.recipients) && typeof meta.recipients[0] === "string"
          ? meta.recipients[0]
          : null);
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
      return "/dashboard/quotes";
    case "deficiency":
      return "/dashboard/operations?tab=deficiencies";
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
    case "deficiency":
      return "View deficiencies";
    case "asset":
      return "View equipment";
    case "company":
      return "Organization";
    default:
      return "View";
  }
}
