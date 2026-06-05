import type { AppRole } from "@/lib/auth/roles";
import {
  buildImportIndexes,
  buildingAddressKey,
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
  site: string;
  detail: string;
  willCreateCustomer: boolean;
  willCreateBuilding: boolean;
};

export type CustomerImportSummary = {
  total: number;
  ready: number;
  errors: number;
  duplicates: number;
  newCustomers: number;
  newBuildings: number;
};

export type ResolvedCustomerImportRow = {
  line: number;
  status: CustomerImportPreviewStatus;
  preview: CustomerImportPreviewRow;
  branchId?: string;
  customerId?: string;
  willCreateCustomer: boolean;
  willCreateBuilding: boolean;
  row?: CustomerImportRow;
};

type BranchRow = { id: string; name: string; isDefault: boolean };

type CustomerRow = {
  id: string;
  name: string;
  branchId: string;
};

function formatSiteLabel(row: CustomerImportRow): string {
  if (!row.hasBuildingSite) return "—";
  return row.buildingName?.trim() || row.addressLine1 || "—";
}

function formatAddress(row: CustomerImportRow): string {
  if (!row.hasBuildingSite || !row.addressLine1 || !row.city || !row.region || !row.postalCode) {
    return "—";
  }
  const line2 = row.addressLine2 ? `, ${row.addressLine2}` : "";
  return `${row.addressLine1}${line2}, ${row.city}, ${row.region} ${row.postalCode}`;
}

export function resolveCustomerImportRows(input: {
  rows: Array<{ line: number; data: CustomerImportRow }>;
  branches: BranchRow[];
  customers: CustomerRow[];
  existingBuildingKeys: Set<string>;
  defaultBranchId: string;
  role: AppRole;
  userBranchId: string | null;
}): { resolved: ResolvedCustomerImportRow[]; summary: CustomerImportSummary } {
  const { customersByBranch } = buildImportIndexes(input.customers);
  const seenCustomerOnlyInFile = new Set<string>();
  const seenBuildingInFile = new Set<string>();
  const newCustomerKeys = new Set<string>();
  const resolved: ResolvedCustomerImportRow[] = [];

  let ready = 0;
  let errors = 0;
  let duplicates = 0;
  let newBuildings = 0;

  for (const { line, data } of input.rows) {
    const emailDisplay = data.email ?? "—";
    const site = formatSiteLabel(data);
    const address = formatAddress(data);
    const basePreview: CustomerImportPreviewRow = {
      line,
      status: "error",
      branch: data.branch || "—",
      customer: data.name,
      email: emailDisplay,
      site,
      detail: "",
      willCreateCustomer: false,
      willCreateBuilding: false,
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
        willCreateBuilding: false,
      });
      continue;
    }

    const customerKey = normalizeNameKey(data.name);
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
          willCreateCustomer: false,
          willCreateBuilding: false,
        },
        willCreateCustomer: false,
        willCreateBuilding: false,
      });
      continue;
    }

    let customerId: string | undefined = matches[0]?.id;
    let willCreateCustomer = !customerId;

    if (data.hasBuildingSite) {
      const addrKey = buildingAddressKey({
        addressLine1: data.addressLine1!,
        city: data.city!,
        postalCode: data.postalCode!,
      });
      const fileKey = `${branchResult.branchId}|${customerKey}|${addrKey}`;
      if (seenBuildingInFile.has(fileKey)) {
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
            willCreateBuilding: true,
          },
          branchId: branchResult.branchId,
          customerId,
          willCreateCustomer,
          willCreateBuilding: true,
          row: data,
        });
        continue;
      }
      seenBuildingInFile.add(fileKey);

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
              willCreateBuilding: false,
            },
            branchId: branchResult.branchId,
            customerId,
            willCreateCustomer: false,
            willCreateBuilding: false,
            row: data,
          });
          continue;
        }
      } else {
        newCustomerKeys.add(`${branchResult.branchId}|${customerKey}`);
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
          willCreateBuilding: true,
        },
        branchId: branchResult.branchId,
        customerId,
        willCreateCustomer,
        willCreateBuilding: true,
        row: data,
      });
      continue;
    }

    const fileKey = `${branchResult.branchId}|${customerKey}`;
    if (seenCustomerOnlyInFile.has(fileKey)) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          status: "duplicate",
          detail: "Duplicate row in this file (same branch and customer name).",
          willCreateCustomer: false,
          willCreateBuilding: false,
        },
        branchId: branchResult.branchId,
        willCreateCustomer: false,
        willCreateBuilding: false,
      });
      continue;
    }
    seenCustomerOnlyInFile.add(fileKey);

    if (customerId) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          status: "duplicate",
          detail: "Customer already exists in this branch.",
          willCreateCustomer: false,
          willCreateBuilding: false,
        },
        branchId: branchResult.branchId,
        customerId,
        willCreateCustomer: false,
        willCreateBuilding: false,
      });
      continue;
    }

    newCustomerKeys.add(`${branchResult.branchId}|${customerKey}`);
    ready += 1;
    resolved.push({
      line,
      status: "ready",
      preview: {
        ...basePreview,
        branch: branchResult.branchLabel,
        status: "ready",
        detail: "Will create customer.",
        willCreateCustomer: true,
        willCreateBuilding: false,
      },
      branchId: branchResult.branchId,
      willCreateCustomer: true,
      willCreateBuilding: false,
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
