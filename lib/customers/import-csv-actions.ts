"use server";

import { CustomerContactRole, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canManageCustomers } from "@/lib/auth/permissions";
import { getDefaultBranchId } from "@/lib/branches/default-branch";
import { resolveImportDefaultBranchId } from "@/lib/branches/import-default";
import {
  buildingAddressKey,
  normalizeNameKey,
} from "@/lib/buildings/import-csv-resolve";
import { requireWritableTenant } from "@/lib/billing/guards";
import {
  CUSTOMER_IMPORT_MAX_ROWS,
  canonicalizeCustomerImportHeader,
  customerImportActionSchema,
  customerImportRowSchema,
} from "@/lib/customers/import-csv-schemas";
import {
  resolveCustomerImportRows,
  type CustomerImportPreviewRow,
  type CustomerImportSummary,
} from "@/lib/customers/import-csv-resolve";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { getDefaultCountryForMarket } from "@/lib/market/operating-market";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseCsv, rowToRecord } from "@/lib/import/parse-csv";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type CustomerImportPreviewResult =
  | { ok: false; error: string }
  | {
      ok: true;
      mode: "preview";
      rows: CustomerImportPreviewRow[];
      summary: CustomerImportSummary;
      canCommit: boolean;
    };

export type CustomerImportCommitResult =
  | { ok: false; error: string }
  | {
      ok: true;
      mode: "commit";
      createdCustomers: number;
      createdBuildings: number;
    };

export type CustomerImportResult = CustomerImportPreviewResult | CustomerImportCommitResult;

async function loadImportContext(companyId: string) {
  const [branches, customers, buildings] = await Promise.all([
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
        customerId: true,
        addressLine1: true,
        city: true,
        postalCode: true,
      },
    }),
  ]);

  const existingBuildingKeys = new Set(
    buildings.map((b) =>
      `${b.customerId}|${buildingAddressKey({
        addressLine1: b.addressLine1,
        city: b.city,
        postalCode: b.postalCode,
      })}`,
    ),
  );

  const defaultBranchId = await getDefaultBranchId(companyId);
  return { branches, customers, existingBuildingKeys, defaultBranchId };
}

function parseImportRows(csv: string, defaultCountry: string) {
  const parsed = parseCsv(csv);
  if (parsed.headers.length === 0) {
    return { ok: false as const, error: "CSV must include a header row." };
  }

  const canonicalHeaders = parsed.headers.map(canonicalizeCustomerImportHeader);
  if (!canonicalHeaders.includes("customer")) {
    return {
      ok: false as const,
      error: "Missing required column: customer (or customer_name / name).",
    };
  }

  if (parsed.rows.length === 0) {
    return { ok: false as const, error: "CSV has no data rows." };
  }
  if (parsed.rows.length > CUSTOMER_IMPORT_MAX_ROWS) {
    return {
      ok: false as const,
      error: `Import up to ${CUSTOMER_IMPORT_MAX_ROWS} rows per file.`,
    };
  }

  const rows: Array<
    | { line: number; data: ReturnType<typeof customerImportRowSchema.parse> }
    | { line: number; error: string; record: Record<string, string> }
  > = [];

  for (let i = 0; i < parsed.rows.length; i += 1) {
    const line = i + 2;
    const record = rowToRecord(canonicalHeaders, parsed.rows[i]!);
    if (!record.country?.trim()) {
      record.country = defaultCountry;
    }
    const result = customerImportRowSchema.safeParse(record);
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
): CustomerImportPreviewRow[] {
  return rows.map((row) => ({
    line: row.line,
    status: "error" as const,
    branch: row.record.branch?.trim() || "—",
    customer: row.record.customer?.trim() || row.record.name?.trim() || "—",
    email: row.record.email?.trim() || "—",
    site: row.record.building_name?.trim() || row.record.address_line1?.trim() || "—",
    detail: row.error,
    willCreateCustomer: false,
    willCreateBuilding: false,
  }));
}

async function createCustomerFromImportRow(
  tx: Prisma.TransactionClient,
  input: {
    companyId: string;
    branchId: string;
    row: ReturnType<typeof customerImportRowSchema.parse>;
    actorUserId: string;
  },
): Promise<string> {
  const created = await tx.customer.create({
    data: {
      companyId: input.companyId,
      branchId: input.branchId,
      name: input.row.name,
      email: input.row.email ?? null,
      phone: input.row.phone ?? null,
      ...(input.row.email || input.row.phone
        ? {
            contacts: {
              create: {
                name: input.row.name,
                email: input.row.email ?? null,
                phone: input.row.phone ?? null,
                role: CustomerContactRole.billing,
              },
            },
          }
        : {}),
    },
    select: { id: true },
  });

  await writeAuditEvent({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    action: "customer.created",
    entityType: "customer",
    entityId: created.id,
    metadata: { name: input.row.name, source: "customer_csv_import" },
  });

  return created.id;
}

export async function runCustomerImport(input: unknown): Promise<CustomerImportResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  if (!canManageCustomers(session.role)) {
    return { ok: false, error: "You do not have permission to import customers." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsedAction = customerImportActionSchema.safeParse(input);
  if (!parsedAction.success) {
    return { ok: false, error: parsedAction.error.issues[0]?.message ?? "Invalid request." };
  }

  const parsedRows = parseImportRows(
    parsedAction.data.csv,
    getDefaultCountryForMarket(session.operatingMarket),
  );
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
    (r): r is { line: number; data: ReturnType<typeof customerImportRowSchema.parse> } =>
      "data" in r,
  );

  const { resolved, summary } = resolveCustomerImportRows({
    rows: validRows,
    branches: ctx.branches,
    customers: ctx.customers,
    existingBuildingKeys: ctx.existingBuildingKeys,
    defaultBranchId,
    role: session.role,
    userBranchId: session.userBranchId,
  });

  summary.errors += invalidRows.length;
  summary.total = parsedRows.rows.length;

  if (parsedAction.data.mode === "preview") {
    const previewRows: CustomerImportPreviewRow[] = [
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

  const readyRows = resolved.filter((r) => r.status === "ready" && r.row && r.branchId);
  if (readyRows.length !== summary.ready) {
    return { ok: false, error: "Import data could not be validated. Preview again." };
  }

  const customersCreatedInBatch = new Map<string, string>();

  try {
    const result = await prisma.$transaction(async (tx) => {
      let createdCustomers = 0;
      let createdBuildings = 0;

      for (const item of readyRows) {
        const row = item.row!;
        const branchId = item.branchId!;
        let customerId = item.customerId;

        if (!customerId) {
          const batchKey = `${branchId}|${normalizeNameKey(row.name)}`;
          const existingInBatch = customersCreatedInBatch.get(batchKey);
          if (existingInBatch) {
            customerId = existingInBatch;
          } else {
            customerId = await createCustomerFromImportRow(tx, {
              companyId: session.companyId,
              branchId,
              row,
              actorUserId: session.appUserId,
            });
            customersCreatedInBatch.set(batchKey, customerId);
            createdCustomers += 1;
          }
        }

        if (!row.hasBuildingSite) continue;

        const building = await tx.building.create({
          data: {
            customerId,
            name: row.buildingName ?? null,
            addressLine1: row.addressLine1!,
            addressLine2: row.addressLine2 ?? null,
            city: row.city!,
            region: row.region!,
            postalCode: row.postalCode!,
            country: row.country,
            fireDistrict: row.fireDistrict ?? null,
            permitNumber: row.permitNumber ?? null,
            permitExpiresAt: row.permitExpiresAt ?? null,
          },
          select: { id: true },
        });
        createdBuildings += 1;

        await writeAuditEvent({
          companyId: session.companyId,
          actorUserId: session.appUserId,
          action: "building.created",
          entityType: "building",
          entityId: building.id,
          metadata: { customerId, source: "customer_csv_import" },
        });

        const dbKey = `${customerId}|${buildingAddressKey({
          addressLine1: row.addressLine1!,
          city: row.city!,
          postalCode: row.postalCode!,
        })}`;
        ctx.existingBuildingKeys.add(dbKey);
      }

      return { createdCustomers, createdBuildings };
    });

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/buildings");
    revalidatePath("/dashboard/buildings/import");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/jobs/new");

    return {
      ok: true,
      mode: "commit",
      createdCustomers: result.createdCustomers,
      createdBuildings: result.createdBuildings,
    };
  } catch (error) {
    captureServerActionError("runCustomerImport", error);
    return { ok: false, error: "Import failed. Please try again." };
  }
}
