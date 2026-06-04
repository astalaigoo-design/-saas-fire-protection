import type { AppRole } from "@/lib/auth/roles";
import {
  buildImportIndexes,
  normalizeNameKey,
  resolveBranchId,
} from "@/lib/buildings/import-csv-resolve";
import type { CustomerImportRow } from "@/lib/customers/import-csv-schemas";

export type CustomerImportPreviewStatus = "ready" | "error" | "duplicate";

export type CustomerImportPreviewRow = {
  line: number;
  status: CustomerImportPreviewStatus;
  branch: string;
  customer: string;
  email: string;
  detail: string;
};

export type CustomerImportSummary = {
  total: number;
  ready: number;
  errors: number;
  duplicates: number;
  newCustomers: number;
};

export type ResolvedCustomerImportRow = {
  line: number;
  status: CustomerImportPreviewStatus;
  preview: CustomerImportPreviewRow;
  branchId?: string;
  customerId?: string;
  row?: CustomerImportRow;
};

type BranchRow = { id: string; name: string; isDefault: boolean };

type CustomerRow = {
  id: string;
  name: string;
  branchId: string;
};

export function resolveCustomerImportRows(input: {
  rows: Array<{ line: number; data: CustomerImportRow }>;
  branches: BranchRow[];
  customers: CustomerRow[];
  defaultBranchId: string;
  role: AppRole;
  userBranchId: string | null;
}): { resolved: ResolvedCustomerImportRow[]; summary: CustomerImportSummary } {
  const { customersByBranch } = buildImportIndexes(input.customers);
  const seenInFile = new Set<string>();
  const resolved: ResolvedCustomerImportRow[] = [];

  let ready = 0;
  let errors = 0;
  let duplicates = 0;
  let newCustomers = 0;

  for (const { line, data } of input.rows) {
    const emailDisplay = data.email ?? "—";
    const basePreview: CustomerImportPreviewRow = {
      line,
      status: "error",
      branch: data.branch || "—",
      customer: data.name,
      email: emailDisplay,
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
        preview: { ...basePreview, branch: data.branch || "—", detail: branchResult.error },
      });
      continue;
    }

    const customerKey = normalizeNameKey(data.name);
    const fileKey = `${branchResult.branchId}|${customerKey}`;
    if (seenInFile.has(fileKey)) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          status: "duplicate",
          detail: "Duplicate row in this file (same branch and customer name).",
        },
        branchId: branchResult.branchId,
      });
      continue;
    }
    seenInFile.add(fileKey);

    const branchCustomers = customersByBranch.get(branchResult.branchId);
    const matches = branchCustomers?.get(customerKey) ?? [];

    if (matches.length > 1) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          detail: `Multiple customers named “${data.name}” in ${branchResult.branchLabel}. Rename or merge duplicates first.`,
        },
      });
      continue;
    }

    if (matches.length === 1) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          status: "duplicate",
          detail: "Customer already exists in this branch.",
        },
        branchId: branchResult.branchId,
        customerId: matches[0]!.id,
      });
      continue;
    }

    ready += 1;
    newCustomers += 1;
    resolved.push({
      line,
      status: "ready",
      preview: {
        ...basePreview,
        branch: branchResult.branchLabel,
        status: "ready",
        detail: "Will create customer.",
      },
      branchId: branchResult.branchId,
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
      newCustomers,
    },
  };
}
