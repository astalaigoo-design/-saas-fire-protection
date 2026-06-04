import type { AppRole } from "@/lib/auth/roles";
import { canAssignCustomerToBranch } from "@/lib/branches/user-branch";
import type { BuildingImportRow } from "@/lib/buildings/import-csv-schemas";

export type BuildingImportPreviewStatus = "ready" | "error" | "duplicate";

export type BuildingImportPreviewRow = {
  line: number;
  status: BuildingImportPreviewStatus;
  branch: string;
  customer: string;
  site: string;
  address: string;
  detail: string;
  willCreateCustomer: boolean;
};

export type BuildingImportSummary = {
  total: number;
  ready: number;
  errors: number;
  duplicates: number;
  newCustomers: number;
  newBuildings: number;
};

export type ResolvedBuildingImportRow = {
  line: number;
  status: BuildingImportPreviewStatus;
  preview: BuildingImportPreviewRow;
  branchId?: string;
  customerId?: string;
  willCreateCustomer: boolean;
  row?: BuildingImportRow;
};

type BranchRow = { id: string; name: string; isDefault: boolean };

type CustomerRow = {
  id: string;
  name: string;
  branchId: string;
};

export function normalizeNameKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildingAddressKey(input: {
  addressLine1: string;
  city: string;
  postalCode: string;
}): string {
  return [
    normalizeNameKey(input.addressLine1),
    normalizeNameKey(input.city),
    normalizeNameKey(input.postalCode),
  ].join("|");
}

function formatSiteLabel(row: BuildingImportRow): string {
  return row.buildingName?.trim() || row.addressLine1;
}

function formatAddress(row: BuildingImportRow): string {
  const line2 = row.addressLine2 ? `, ${row.addressLine2}` : "";
  return `${row.addressLine1}${line2}, ${row.city}, ${row.region} ${row.postalCode}`;
}

export function resolveBranchId(input: {
  branchInput: string;
  branches: BranchRow[];
  defaultBranchId: string;
  role: AppRole;
  userBranchId: string | null;
}): { branchId: string; branchLabel: string } | { error: string } {
  const { branchInput, branches, defaultBranchId, role, userBranchId } = input;

  if (branches.length === 1) {
    const only = branches[0]!;
    if (branchInput) {
      const match = branches.find(
        (b) => normalizeNameKey(b.name) === normalizeNameKey(branchInput),
      );
      if (!match) {
        return { error: `Unknown branch “${branchInput}”. Use “${only.name}”.` };
      }
      if (
        userBranchId &&
        !canAssignCustomerToBranch({ role, userBranchId, branchId: match.id })
      ) {
        return { error: "You can only import into your assigned branch." };
      }
      return { branchId: match.id, branchLabel: match.name };
    }
    if (
      userBranchId &&
      !canAssignCustomerToBranch({ role, userBranchId, branchId: only.id })
    ) {
      return { error: "You can only import into your assigned branch." };
    }
    return { branchId: only.id, branchLabel: only.name };
  }

  if (!branchInput) {
    const fallback = branches.find((b) => b.id === defaultBranchId) ?? branches[0];
    if (!fallback) return { error: "No branch configured for this company." };
    if (
      userBranchId &&
      !canAssignCustomerToBranch({ role, userBranchId, branchId: fallback.id })
    ) {
      return { error: "Branch column is required for your account." };
    }
    return { branchId: fallback.id, branchLabel: fallback.name };
  }

  const match = branches.find(
    (b) => normalizeNameKey(b.name) === normalizeNameKey(branchInput),
  );
  if (!match) {
    const names = branches.map((b) => b.name).join(", ");
    return { error: `Unknown branch “${branchInput}”. Expected one of: ${names}.` };
  }
  if (
    userBranchId &&
    !canAssignCustomerToBranch({ role, userBranchId, branchId: match.id })
  ) {
    return { error: "You can only import into your assigned branch." };
  }
  return { branchId: match.id, branchLabel: match.name };
}

export function buildImportIndexes(customers: CustomerRow[]) {
  const customersByBranch = new Map<string, Map<string, CustomerRow[]>>();

  for (const customer of customers) {
    const branchMap =
      customersByBranch.get(customer.branchId) ?? new Map<string, CustomerRow[]>();
    const key = normalizeNameKey(customer.name);
    const list = branchMap.get(key) ?? [];
    list.push(customer);
    branchMap.set(key, list);
    customersByBranch.set(customer.branchId, branchMap);
  }

  return { customersByBranch };
}

export function resolveBuildingImportRows(input: {
  rows: Array<{ line: number; data: BuildingImportRow }>;
  branches: BranchRow[];
  customers: CustomerRow[];
  existingBuildingKeys: Set<string>;
  defaultBranchId: string;
  role: AppRole;
  userBranchId: string | null;
}): { resolved: ResolvedBuildingImportRow[]; summary: BuildingImportSummary } {
  const { customersByBranch } = buildImportIndexes(input.customers);
  const seenInFile = new Set<string>();
  const newCustomerKeys = new Set<string>();
  const resolved: ResolvedBuildingImportRow[] = [];

  let ready = 0;
  let errors = 0;
  let duplicates = 0;
  let newBuildings = 0;

  for (const { line, data } of input.rows) {
    const site = formatSiteLabel(data);
    const address = formatAddress(data);
    const basePreview: BuildingImportPreviewRow = {
      line,
      status: "error",
      branch: data.branch || "—",
      customer: data.customer,
      site,
      address,
      detail: "",
      willCreateCustomer: false,
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
        willCreateCustomer: false,
      });
      continue;
    }

    const customerKey = normalizeNameKey(data.customer);
    const branchCustomers = customersByBranch.get(branchResult.branchId);
    const matches = branchCustomers?.get(customerKey) ?? [];
    let customerId: string | undefined;
    let willCreateCustomer = false;

    if (matches.length > 1) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          detail: `Multiple customers named “${data.customer}” in ${branchResult.branchLabel}. Rename or merge duplicates first.`,
          willCreateCustomer: false,
        },
        willCreateCustomer: false,
      });
      continue;
    }

    if (matches.length === 1) {
      customerId = matches[0]!.id;
    } else {
      willCreateCustomer = true;
      newCustomerKeys.add(`${branchResult.branchId}|${customerKey}`);
    }

    const addrKey = buildingAddressKey({
      addressLine1: data.addressLine1,
      city: data.city,
      postalCode: data.postalCode,
    });
    const fileKey = `${branchResult.branchId}|${customerKey}|${addrKey}`;
    if (seenInFile.has(fileKey)) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          status: "duplicate",
          detail: "Duplicate row in this file (same branch, customer, and address).",
          willCreateCustomer,
        },
        branchId: branchResult.branchId,
        customerId,
        willCreateCustomer,
        row: data,
      });
      continue;
    }
    seenInFile.add(fileKey);

    if (customerId) {
      const dbKey = `${customerId}|${addrKey}`;
      if (input.existingBuildingKeys.has(dbKey)) {
        duplicates += 1;
        resolved.push({
          line,
          status: "duplicate",
          preview: {
            ...basePreview,
            branch: branchResult.branchLabel,
            status: "duplicate",
            detail: "A building with this address already exists for this customer.",
            willCreateCustomer: false,
          },
          branchId: branchResult.branchId,
          customerId,
          willCreateCustomer: false,
          row: data,
        });
        continue;
      }
    }

    ready += 1;
    newBuildings += 1;
    resolved.push({
      line,
      status: "ready",
      preview: {
        ...basePreview,
        branch: branchResult.branchLabel,
        status: "ready",
        detail: willCreateCustomer
          ? "Will create customer and building."
          : "Will add building to existing customer.",
        willCreateCustomer,
      },
      branchId: branchResult.branchId,
      customerId,
      willCreateCustomer,
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
      newCustomers: newCustomerKeys.size,
      newBuildings,
    },
  };
}
