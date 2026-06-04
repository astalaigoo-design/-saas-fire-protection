import type { AppRole } from "@/lib/auth/roles";
import {
  buildImportIndexes,
  normalizeNameKey,
  resolveBranchId,
} from "@/lib/buildings/import-csv-resolve";
import { resolveBuildingForImportRow } from "@/lib/import/resolve-building-for-customer";
import type { ScheduleImportRow } from "@/lib/scheduling/import-csv-schemas";
import {
  combineDateAndTime,
  parseDateInputValue,
} from "@/lib/scheduling/calendar";
import {
  buildRecurrenceSchedule,
  getRecurrenceOccurrenceCount,
  type RecurrenceOption,
} from "@/lib/scheduling/recurrence";

export type ScheduleImportPreviewStatus = "ready" | "error" | "duplicate";

export type ScheduleImportPreviewRow = {
  line: number;
  status: ScheduleImportPreviewStatus;
  branch: string;
  customer: string;
  site: string;
  inspectionType: string;
  when: string;
  technician: string;
  detail: string;
};

export type ScheduleImportSummary = {
  total: number;
  ready: number;
  errors: number;
  duplicates: number;
  totalVisits: number;
};

export type ResolvedScheduleImportRow = {
  line: number;
  status: ScheduleImportPreviewStatus;
  preview: ScheduleImportPreviewRow;
  buildingId?: string;
  inspectionTypeId?: string;
  assignedToUserId?: string | null;
  scheduledAt?: Date;
  recurrence?: RecurrenceOption;
  visitCount?: number;
  row?: ScheduleImportRow;
};

type BranchRow = { id: string; name: string; isDefault: boolean };
type CustomerRow = { id: string; name: string; branchId: string };
type BuildingRow = {
  id: string;
  customerId: string;
  name: string | null;
  addressLine1: string;
  city: string;
  postalCode: string;
};
type InspectionTypeRow = { id: string; code: string; name: string };
type TechnicianRow = { id: string; name: string | null; email: string | null };

function scheduleSlotKey(buildingId: string, scheduledAt: Date, inspectionTypeId: string): string {
  const iso = scheduledAt.toISOString().slice(0, 16);
  return `${buildingId}|${iso}|${inspectionTypeId}`;
}

function resolveInspectionTypeId(
  input: string,
  types: InspectionTypeRow[],
): { id: string; label: string } | { error: string } {
  const key = normalizeNameKey(input);
  const byCode = types.filter((t) => normalizeNameKey(t.code) === key);
  if (byCode.length === 1) {
    return { id: byCode[0]!.id, label: byCode[0]!.name };
  }
  const byName = types.filter((t) => normalizeNameKey(t.name) === key);
  if (byName.length === 1) {
    return { id: byName[0]!.id, label: byName[0]!.name };
  }
  if (byCode.length + byName.length === 0) {
    const codes = types.map((t) => t.code).join(", ");
    return {
      error: `Unknown inspection type “${input}”. Use a type code (${codes}) or exact type name.`,
    };
  }
  return { error: `Ambiguous inspection type “${input}”. Use the type code.` };
}

function resolveTechnicianId(
  input: string | undefined,
  technicians: TechnicianRow[],
): { id: string; label: string } | { id: null } | { error: string } {
  if (!input?.trim()) return { id: null };
  const email = input.trim().toLowerCase();
  const byEmail = technicians.filter((t) => t.email?.trim().toLowerCase() === email);
  if (byEmail.length === 1) {
    return {
      id: byEmail[0]!.id,
      label: byEmail[0]!.name ?? byEmail[0]!.email ?? "Technician",
    };
  }
  const key = normalizeNameKey(input);
  const byName = technicians.filter((t) => normalizeNameKey(t.name ?? "") === key);
  if (byName.length === 1) {
    return { id: byName[0]!.id, label: byName[0]!.name ?? "Technician" };
  }
  if (byEmail.length + byName.length === 0) {
    return { error: `Technician “${input}” not found. Use their sign-in email.` };
  }
  return { error: `Multiple technicians match “${input}”. Use email.` };
}

export function resolveScheduleImportRows(input: {
  rows: Array<{ line: number; data: ScheduleImportRow }>;
  branches: BranchRow[];
  customers: CustomerRow[];
  buildings: BuildingRow[];
  inspectionTypes: InspectionTypeRow[];
  technicians: TechnicianRow[];
  existingSlotKeys: Set<string>;
  defaultBranchId: string;
  role: AppRole;
  userBranchId: string | null;
}): { resolved: ResolvedScheduleImportRow[]; summary: ScheduleImportSummary } {
  const { customersByBranch } = buildImportIndexes(input.customers);
  const buildingsByCustomerId = new Map<string, BuildingRow[]>();
  for (const building of input.buildings) {
    const list = buildingsByCustomerId.get(building.customerId) ?? [];
    list.push(building);
    buildingsByCustomerId.set(building.customerId, list);
  }

  const seenInFile = new Set<string>();
  const resolved: ResolvedScheduleImportRow[] = [];
  let ready = 0;
  let errors = 0;
  let duplicates = 0;
  let totalVisits = 0;

  for (const { line, data } of input.rows) {
    const basePreview: ScheduleImportPreviewRow = {
      line,
      status: "error",
      branch: data.branch || "—",
      customer: data.customer,
      site: data.buildingName ?? data.addressLine1 ?? "—",
      inspectionType: data.inspectionTypeInput,
      when: `${data.scheduledDate} ${data.scheduledTime}`,
      technician: data.technicianEmail ?? "—",
      detail: "",
    };

    const branchResult = resolveBranchId({
      branchInput: data.branch,
      branches: input.branches,
      defaultBranchId: input.defaultBranchId,
      role: input.role,
      userBranchId: input.userBranchId,
    });

    if ("error" in branchResult) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: { ...basePreview, detail: branchResult.error },
      });
      continue;
    }

    const customerKey = normalizeNameKey(data.customer);
    const customerMatches = customersByBranch.get(branchResult.branchId)?.get(customerKey) ?? [];

    if (customerMatches.length > 1) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          detail: `Multiple customers named “${data.customer}” in ${branchResult.branchLabel}.`,
        },
      });
      continue;
    }

    if (customerMatches.length === 0) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          detail: "Customer not found. Import customers and buildings first.",
        },
      });
      continue;
    }

    const customerId = customerMatches[0]!.id;
    const buildingResult = resolveBuildingForImportRow({
      row: data,
      buildingsForCustomer: buildingsByCustomerId.get(customerId) ?? [],
    });

    if ("error" in buildingResult) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          detail: buildingResult.error,
        },
      });
      continue;
    }

    const typeResult = resolveInspectionTypeId(data.inspectionTypeInput, input.inspectionTypes);
    if ("error" in typeResult) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          detail: typeResult.error,
        },
      });
      continue;
    }

    const date = parseDateInputValue(data.scheduledDate);
    if (!date) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          inspectionType: typeResult.label,
          detail: "Invalid scheduled_date (use YYYY-MM-DD).",
        },
      });
      continue;
    }

    const scheduledAt = combineDateAndTime(date, data.scheduledTime);
    if (!scheduledAt) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          inspectionType: typeResult.label,
          detail: "Invalid scheduled_time (use HH:MM, 24-hour).",
        },
      });
      continue;
    }

    const techResult = resolveTechnicianId(data.technicianEmail, input.technicians);
    if ("error" in techResult) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          inspectionType: typeResult.label,
          detail: techResult.error,
        },
      });
      continue;
    }

    const recurrence = data.recurrence as RecurrenceOption;
    const visitCount = getRecurrenceOccurrenceCount(recurrence);
    const slotKey = scheduleSlotKey(buildingResult.buildingId, scheduledAt, typeResult.id);

    if (seenInFile.has(slotKey)) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          inspectionType: typeResult.label,
          technician: techResult.id ? techResult.label : "Unassigned",
          status: "duplicate",
          detail: "Duplicate row in this file (same site, time, and type).",
        },
      });
      continue;
    }

    if (input.existingSlotKeys.has(slotKey)) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          inspectionType: typeResult.label,
          technician: techResult.id ? techResult.label : "Unassigned",
          status: "duplicate",
          detail: "An inspection is already scheduled at this date and time for this site.",
        },
      });
      continue;
    }

    seenInFile.add(slotKey);
    ready += 1;
    totalVisits += visitCount;

    const techLabel = techResult.id ? techResult.label : "Unassigned";
    resolved.push({
      line,
      status: "ready",
      preview: {
        ...basePreview,
        branch: branchResult.branchLabel,
        site: buildingResult.siteLabel,
        inspectionType: typeResult.label,
        technician: techLabel,
        status: "ready",
        detail:
          visitCount > 1
            ? `Will schedule ${visitCount} ${recurrence} visits.`
            : "Will schedule one visit.",
      },
      buildingId: buildingResult.buildingId,
      inspectionTypeId: typeResult.id,
      assignedToUserId: techResult.id,
      scheduledAt,
      recurrence,
      visitCount,
      row: data,
    });
  }

  return {
    resolved,
    summary: {
      total: input.rows.length,
      ready,
      errors,
      duplicates,
      totalVisits,
    },
  };
}

export function buildVisitDatesForRow(
  scheduledAt: Date,
  recurrence: RecurrenceOption,
): Date[] {
  return buildRecurrenceSchedule(scheduledAt, recurrence);
}
