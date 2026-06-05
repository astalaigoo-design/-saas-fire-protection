"use server";

import type { RecurrenceInterval } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canManageJobs } from "@/lib/auth/permissions";
import { getDefaultBranchId } from "@/lib/branches/default-branch";
import { resolveImportDefaultBranchId } from "@/lib/branches/import-default";
import { requireWritableTenant } from "@/lib/billing/guards";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseCsv, rowToRecord } from "@/lib/import/parse-csv";
import { notifyInspectionScheduled } from "@/lib/notifications/notify-inspection-scheduled";
import { resolveInspectionChecklistCreateInputs } from "@/lib/inspections/resolve-checklist-items";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import {
  SCHEDULE_IMPORT_MAX_ROWS,
  SCHEDULE_IMPORT_MAX_VISITS,
  canonicalizeScheduleImportHeader,
  scheduleImportActionSchema,
  scheduleImportRowSchema,
} from "@/lib/scheduling/import-csv-schemas";
import {
  buildVisitDatesForRow,
  resolveScheduleImportRows,
  type ScheduleImportPreviewRow,
  type ScheduleImportSummary,
} from "@/lib/scheduling/import-csv-resolve";
import type { RecurrenceOption } from "@/lib/scheduling/recurrence";

export type ScheduleImportPreviewResult =
  | { ok: false; error: string }
  | {
      ok: true;
      mode: "preview";
      rows: ScheduleImportPreviewRow[];
      summary: ScheduleImportSummary;
      canCommit: boolean;
    };

export type ScheduleImportCommitResult =
  | { ok: false; error: string }
  | {
      ok: true;
      mode: "commit";
      scheduledRows: number;
      scheduledVisits: number;
    };

export type ScheduleImportResult = ScheduleImportPreviewResult | ScheduleImportCommitResult;

function scheduleSlotKey(buildingId: string, scheduledAt: Date, inspectionTypeId: string): string {
  return `${buildingId}|${scheduledAt.toISOString().slice(0, 16)}|${inspectionTypeId}`;
}

async function loadImportContext(companyId: string) {
  const [branches, customers, buildings, inspectionTypes, technicians, inspections] =
    await Promise.all([
      prisma.branch.findMany({
        where: { companyId },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        select: { id: true, name: true, isDefault: true, isImportDefault: true },
      }),
      prisma.customer.findMany({
        where: { companyId },
        select: { id: true, name: true, branchId: true },
      }),
      prisma.building.findMany({
        where: { customer: { companyId } },
        select: {
          id: true,
          customerId: true,
          name: true,
          addressLine1: true,
          city: true,
          postalCode: true,
        },
      }),
      prisma.inspectionType.findMany({
        where: { companyId },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { companyId, role: { in: ["technician", "admin"] }, active: true },
        select: { id: true, name: true, email: true },
      }),
      prisma.inspection.findMany({
        where: {
          companyId,
          status: { in: ["scheduled", "in_progress"] },
        },
        select: { buildingId: true, scheduledAt: true, inspectionTypeId: true },
      }),
    ]);

  const existingSlotKeys = new Set(
    inspections.map((i) => scheduleSlotKey(i.buildingId, i.scheduledAt, i.inspectionTypeId)),
  );

  const defaultBranchId = await getDefaultBranchId(companyId);
  return {
    branches,
    customers,
    buildings,
    inspectionTypes,
    technicians,
    existingSlotKeys,
    defaultBranchId,
  };
}

function parseImportRows(csv: string) {
  const parsed = parseCsv(csv);
  if (parsed.headers.length === 0) {
    return { ok: false as const, error: "CSV must include a header row." };
  }

  const canonicalHeaders = parsed.headers.map(canonicalizeScheduleImportHeader);
  const required = ["inspection_type", "scheduled_date"];
  const missing = required.filter((key) => !canonicalHeaders.includes(key));
  if (missing.length > 0) {
    return {
      ok: false as const,
      error: `Missing required column(s): ${missing.join(", ")}.`,
    };
  }

  const hasSiteColumn =
    canonicalHeaders.includes("building_name") ||
    (canonicalHeaders.includes("address_line1") &&
      canonicalHeaders.includes("city") &&
      canonicalHeaders.includes("postal_code"));
  if (!hasSiteColumn) {
    return {
      ok: false as const,
      error: "Missing site column: building (or building_name), or address_line1 + city + postal_code.",
    };
  }

  if (parsed.rows.length === 0) {
    return { ok: false as const, error: "CSV has no data rows." };
  }
  if (parsed.rows.length > SCHEDULE_IMPORT_MAX_ROWS) {
    return {
      ok: false as const,
      error: `Import up to ${SCHEDULE_IMPORT_MAX_ROWS} schedule rows per file.`,
    };
  }

  const rows: Array<
    | { line: number; data: ReturnType<typeof scheduleImportRowSchema.parse> }
    | { line: number; error: string; record: Record<string, string> }
  > = [];

  for (let i = 0; i < parsed.rows.length; i += 1) {
    const line = i + 2;
    const record = rowToRecord(canonicalHeaders, parsed.rows[i]!);
    const result = scheduleImportRowSchema.safeParse(record);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid row.";
      rows.push({ line, error: message, record });
      continue;
    }
    rows.push({ line, data: result.data });
  }

  return { ok: true as const, rows };
}

function parseErrorPreviewRows(
  rows: Array<{ line: number; error: string; record: Record<string, string> }>,
): ScheduleImportPreviewRow[] {
  return rows.map((row) => ({
    line: row.line,
    status: "error" as const,
    branch: row.record.branch?.trim() || "—",
    customer: row.record.customer?.trim() || "—",
    site: row.record.building_name?.trim() || row.record.address_line1?.trim() || "—",
    inspectionType: row.record.inspection_type?.trim() || "—",
    when: `${row.record.scheduled_date ?? "—"} ${row.record.scheduled_time ?? ""}`.trim(),
    technician: row.record.technician_email?.trim() || "—",
    detail: row.error,
  }));
}

export async function runScheduleImport(input: unknown): Promise<ScheduleImportResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  if (!canManageJobs(session.role)) {
    return { ok: false, error: "You do not have permission to import schedules." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsedAction = scheduleImportActionSchema.safeParse(input);
  if (!parsedAction.success) {
    return { ok: false, error: parsedAction.error.issues[0]?.message ?? "Invalid request." };
  }

  const parsedRows = parseImportRows(parsedAction.data.csv);
  if (!parsedRows.ok) return { ok: false, error: parsedRows.error };

  const ctx = await loadImportContext(session.companyId);
  const defaultBranchId = resolveImportDefaultBranchId(
    session,
    ctx.branches,
    ctx.defaultBranchId,
  );

  const invalidRows = parsedRows.rows.filter(
    (r): r is { line: number; error: string; record: Record<string, string> } => "error" in r,
  );
  const validRows = parsedRows.rows.filter(
    (r): r is { line: number; data: ReturnType<typeof scheduleImportRowSchema.parse> } =>
      "data" in r,
  );

  const { resolved, summary } = resolveScheduleImportRows({
    rows: validRows,
    branches: ctx.branches,
    customers: ctx.customers,
    buildings: ctx.buildings,
    inspectionTypes: ctx.inspectionTypes,
    assignees: ctx.technicians,
    existingSlotKeys: ctx.existingSlotKeys,
    defaultBranchId,
    role: session.role,
    userBranchId: session.userBranchId,
  });

  summary.errors += invalidRows.length;
  summary.total = parsedRows.rows.length;

  const visitCapExceeded = summary.totalVisits > SCHEDULE_IMPORT_MAX_VISITS;

  if (parsedAction.data.mode === "preview") {
    const previewRows: ScheduleImportPreviewRow[] = [
      ...resolved.map((r) => r.preview),
      ...parseErrorPreviewRows(invalidRows),
    ];

    return {
      ok: true,
      mode: "preview",
      rows: previewRows.sort((a, b) => a.line - b.line),
      summary,
      canCommit:
        summary.ready > 0 && summary.errors === 0 && !visitCapExceeded,
    };
  }

  if (visitCapExceeded) {
    return {
      ok: false,
      error: `This file would create ${summary.totalVisits} visits (max ${SCHEDULE_IMPORT_MAX_VISITS}). Reduce rows or recurrence.`,
    };
  }

  if (invalidRows.length > 0 || summary.errors > 0 || summary.ready === 0) {
    return {
      ok: false,
      error: "Fix all errors in the preview before importing.",
    };
  }

  const readyRows = resolved.filter(
    (r) =>
      r.status === "ready" &&
      r.row &&
      r.buildingId &&
      r.inspectionTypeId &&
      r.scheduledAt &&
      r.recurrence,
  );
  if (readyRows.length !== summary.ready) {
    return { ok: false, error: "Import data could not be validated. Preview again." };
  }

  const checklistByTypeId = new Map<string, Awaited<ReturnType<typeof resolveInspectionChecklistCreateInputs>>>();
  for (const typeId of Array.from(new Set(readyRows.map((r) => r.inspectionTypeId!)))) {
    checklistByTypeId.set(typeId, await resolveInspectionChecklistCreateInputs(typeId));
  }

  const buildingIds = new Set<string>();
  const notifyTargets: Array<{ inspectionId: string; occurrenceCount: number }> = [];

  try {
    const result = await prisma.$transaction(async (tx) => {
      let scheduledRows = 0;
      let scheduledVisits = 0;

      for (const item of readyRows) {
        const buildingId = item.buildingId!;
        const inspectionTypeId = item.inspectionTypeId!;
        const recurrence = item.recurrence as RecurrenceOption;
        const dates = buildVisitDatesForRow(item.scheduledAt!, recurrence);
        const recurrenceGroupId = recurrence === "none" ? null : crypto.randomUUID();
        const recurrenceInterval: RecurrenceInterval | null =
          recurrence === "none" ? null : recurrence;

        const checklistItems = checklistByTypeId.get(inspectionTypeId) ?? [];

        let firstId: string | null = null;
        for (const occurrenceDate of dates) {
          const created = await tx.inspection.create({
            data: {
              companyId: session.companyId,
              buildingId,
              inspectionTypeId,
              assignedToUserId: item.assignedToUserId ?? null,
              scheduledAt: occurrenceDate,
              recurrenceGroupId,
              recurrenceInterval,
              notes: item.row!.notes ?? null,
              items: { create: checklistItems },
            },
            select: { id: true },
          });
          firstId ??= created.id;
          scheduledVisits += 1;

          ctx.existingSlotKeys.add(
            scheduleSlotKey(buildingId, occurrenceDate, inspectionTypeId),
          );
        }

        if (firstId) {
          scheduledRows += 1;
          notifyTargets.push({
            inspectionId: firstId,
            occurrenceCount: dates.length,
          });

          await writeAuditEvent({
            companyId: session.companyId,
            actorUserId: session.appUserId,
            action: "inspection.scheduled",
            entityType: "inspection",
            entityId: firstId,
            metadata: {
              source: "schedule_csv_import",
              occurrenceCount: dates.length,
              buildingId,
            },
          });
        }

        buildingIds.add(buildingId);
      }

      return { scheduledRows, scheduledVisits };
    });

    for (const buildingId of Array.from(buildingIds)) {
      await syncBuildingComplianceStatus(buildingId);
    }

    for (const target of notifyTargets) {
      await notifyInspectionScheduled({
        companyId: session.companyId,
        inspectionId: target.inspectionId,
        occurrenceCount: target.occurrenceCount,
      });
    }

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/jobs/import");
    revalidatePath("/dashboard/inspections");
    revalidatePath("/dashboard");

    return {
      ok: true,
      mode: "commit",
      scheduledRows: result.scheduledRows,
      scheduledVisits: result.scheduledVisits,
    };
  } catch (error) {
    captureServerActionError("runScheduleImport", error);
    return { ok: false, error: "Import failed. Please try again." };
  }
}
