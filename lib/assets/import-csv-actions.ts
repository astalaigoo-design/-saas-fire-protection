"use server";

import { revalidatePath } from "next/cache";
import { canManageCustomers } from "@/lib/auth/permissions";
import { computeDefaultNextServiceDue } from "@/lib/branches/asset-defaults";
import { getDefaultBranchId } from "@/lib/branches/default-branch";
import { resolveImportDefaultBranchId } from "@/lib/branches/import-default";
import { requireWritableTenant } from "@/lib/billing/guards";
import {
  ASSET_IMPORT_MAX_ROWS,
  assetImportActionSchema,
  assetImportRowSchema,
  canonicalizeAssetImportHeader,
} from "@/lib/assets/import-csv-schemas";
import {
  resolveAssetImportRows,
  type AssetImportPreviewRow,
  type AssetImportSummary,
} from "@/lib/assets/import-csv-resolve";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseCsv, rowToRecord } from "@/lib/import/parse-csv";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { parseDateInputValue } from "@/lib/scheduling/calendar";
import { prisma } from "@/lib/prisma";
import type { AssetType } from "@prisma/client";
import { normalizeNameKey } from "@/lib/buildings/import-csv-resolve";

export type AssetImportPreviewResult =
  | { ok: false; error: string }
  | {
      ok: true;
      mode: "preview";
      rows: AssetImportPreviewRow[];
      summary: AssetImportSummary;
      canCommit: boolean;
    };

export type AssetImportCommitResult =
  | { ok: false; error: string }
  | {
      ok: true;
      mode: "commit";
      createdAssets: number;
    };

export type AssetImportResult = AssetImportPreviewResult | AssetImportCommitResult;

function assetDedupeKey(input: {
  buildingId: string;
  tagNumber?: string | null;
  location: string;
  assetType: AssetType;
}): string {
  const tag = input.tagNumber?.trim();
  if (tag) return `${input.buildingId}|tag|${normalizeNameKey(tag)}`;
  return `${input.buildingId}|loc|${normalizeNameKey(input.location)}|${input.assetType}`;
}

async function loadImportContext(companyId: string) {
  const [branches, customers, buildings, assets] = await Promise.all([
    prisma.branch.findMany({
      where: { companyId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isDefault: true,
        isImportDefault: true,
        defaultAssetType: true,
        defaultServiceIntervalMonths: true,
      },
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
    prisma.buildingAsset.findMany({
      where: { active: true, building: { customer: { companyId } } },
      select: {
        buildingId: true,
        tagNumber: true,
        location: true,
        assetType: true,
      },
    }),
  ]);

  const existingAssetKeys = new Set(
    assets.map((a) =>
      assetDedupeKey({
        buildingId: a.buildingId,
        tagNumber: a.tagNumber,
        location: a.location,
        assetType: a.assetType,
      }),
    ),
  );

  const defaultBranchId = await getDefaultBranchId(companyId);
  return { branches, customers, buildings, existingAssetKeys, defaultBranchId };
}

function parseImportRows(csv: string) {
  const parsed = parseCsv(csv);
  if (parsed.headers.length === 0) {
    return { ok: false as const, error: "CSV must include a header row." };
  }

  const canonicalHeaders = parsed.headers.map(canonicalizeAssetImportHeader);
  const required = ["customer", "location"];
  const missing = required.filter((key) => !canonicalHeaders.includes(key));
  if (missing.length > 0) {
    return {
      ok: false as const,
      error: `Missing required column(s): ${missing.join(", ")}.`,
    };
  }

  if (parsed.rows.length === 0) {
    return { ok: false as const, error: "CSV has no data rows." };
  }
  if (parsed.rows.length > ASSET_IMPORT_MAX_ROWS) {
    return {
      ok: false as const,
      error: `Import up to ${ASSET_IMPORT_MAX_ROWS} equipment rows per file.`,
    };
  }

  const rows: Array<
    | { line: number; data: ReturnType<typeof assetImportRowSchema.parse> }
    | { line: number; error: string; record: Record<string, string> }
  > = [];

  for (let i = 0; i < parsed.rows.length; i += 1) {
    const line = i + 2;
    const record = rowToRecord(canonicalHeaders, parsed.rows[i]!);
    const result = assetImportRowSchema.safeParse(record);
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
): AssetImportPreviewRow[] {
  return rows.map((row) => ({
    line: row.line,
    status: "error" as const,
    branch: row.record.branch?.trim() || "—",
    customer: row.record.customer?.trim() || "—",
    site: row.record.building_name?.trim() || row.record.address_line1?.trim() || "—",
    equipment: row.record.asset_type?.trim() || "—",
    location: row.record.location?.trim() || "—",
    tag: row.record.tag_number?.trim() || "—",
    detail: row.error,
  }));
}

function parseOptionalDate(value: string | undefined): Date | null | "invalid" {
  if (!value) return null;
  const parsed = parseDateInputValue(value);
  return parsed ?? "invalid";
}

export async function runAssetImport(input: unknown): Promise<AssetImportResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  if (!canManageCustomers(session.role)) {
    return { ok: false, error: "You do not have permission to import equipment." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsedAction = assetImportActionSchema.safeParse(input);
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
    (r): r is { line: number; data: ReturnType<typeof assetImportRowSchema.parse> } =>
      "data" in r,
  );

  const { resolved, summary } = resolveAssetImportRows({
    rows: validRows,
    branches: ctx.branches,
    customers: ctx.customers,
    buildings: ctx.buildings,
    existingAssetKeys: ctx.existingAssetKeys,
    defaultBranchId,
    role: session.role,
    userBranchId: session.userBranchId,
  });

  summary.errors += invalidRows.length;
  summary.total = parsedRows.rows.length;

  if (parsedAction.data.mode === "preview") {
    const previewRows: AssetImportPreviewRow[] = [
      ...resolved.map((r) => r.preview),
      ...parseErrorPreviewRows(invalidRows),
    ];

    return {
      ok: true,
      mode: "preview",
      rows: previewRows.sort((a, b) => a.line - b.line),
      summary,
      canCommit: summary.ready > 0 && summary.errors === 0,
    };
  }

  if (invalidRows.length > 0 || summary.errors > 0 || summary.ready === 0) {
    return {
      ok: false,
      error: "Fix all errors in the preview before importing.",
    };
  }

  const readyRows = resolved.filter((r) => r.status === "ready" && r.row && r.buildingId);
  if (readyRows.length !== summary.ready) {
    return { ok: false, error: "Import data could not be validated. Preview again." };
  }

  try {
    const createdAssets = await prisma.$transaction(async (tx) => {
      let count = 0;
      const customerIds = new Set<string>();

      for (const item of readyRows) {
        const row = item.row!;
        const buildingId = item.buildingId!;

        const lastServiceAt = parseOptionalDate(row.lastServiceAt);
        if (lastServiceAt === "invalid") {
          throw new Error("INVALID_DATE:last_service");
        }
        let nextServiceDue = parseOptionalDate(row.nextServiceDue);
        if (nextServiceDue === "invalid") {
          throw new Error("INVALID_DATE:next_service");
        }

        const branchForDefaults = item.branchId
          ? ctx.branches.find((b) => b.id === item.branchId)
          : undefined;

        if (!nextServiceDue && branchForDefaults?.defaultServiceIntervalMonths) {
          nextServiceDue = computeDefaultNextServiceDue({
            lastServiceAt,
            intervalMonths: branchForDefaults.defaultServiceIntervalMonths,
          });
        }

        const asset = await tx.buildingAsset.create({
          data: {
            buildingId,
            assetType: row.assetType!,
            tagNumber: row.tagNumber ?? null,
            barcodeValue: row.barcodeValue ?? null,
            location: row.location,
            manufacturer: row.manufacturer ?? null,
            model: row.model ?? null,
            serialNumber: row.serialNumber ?? null,
            lastServiceAt,
            nextServiceDue,
            notes: row.notes ?? null,
          },
          select: { id: true, building: { select: { customerId: true } } },
        });
        count += 1;
        customerIds.add(asset.building.customerId);

        ctx.existingAssetKeys.add(
          assetDedupeKey({
            buildingId,
            tagNumber: row.tagNumber,
            location: row.location,
            assetType: row.assetType,
          }),
        );

        await writeAuditEvent({
          companyId: session.companyId,
          actorUserId: session.appUserId,
          action: "asset.created",
          entityType: "asset",
          entityId: asset.id,
          metadata: {
            buildingId,
            assetType: row.assetType,
            source: "asset_csv_import",
          },
        });
      }

      return { count, customerIds };
    });

    for (const buildingId of new Set(readyRows.map((r) => r.buildingId!))) {
      revalidatePath(`/dashboard/buildings/${buildingId}`);
    }
    for (const customerId of createdAssets.customerIds) {
      revalidatePath(`/dashboard/customers/${customerId}`);
    }
    revalidatePath("/dashboard/buildings");
    revalidatePath("/dashboard/buildings/import-equipment");

    return {
      ok: true,
      mode: "commit",
      createdAssets: createdAssets.count,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_DATE:")) {
      const field = error.message.split(":")[1];
      return {
        ok: false,
        error: `Invalid ${field === "last_service" ? "last service" : "next service"} date (use YYYY-MM-DD).`,
      };
    }
    captureServerActionError("runAssetImport", error);
    return { ok: false, error: "Import failed. Please try again." };
  }
}
