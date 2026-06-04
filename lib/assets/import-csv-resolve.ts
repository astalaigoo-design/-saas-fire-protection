import type { AppRole } from "@/lib/auth/roles";
import { assetTypeLabel } from "@/lib/assets/constants";
import type { AssetImportRow } from "@/lib/assets/import-csv-schemas";
import {
  buildingAddressKey,
  buildImportIndexes,
  normalizeNameKey,
  resolveBranchId,
} from "@/lib/buildings/import-csv-resolve";
import { buildingLabel } from "@/lib/customers/format";
import type { AssetType } from "@prisma/client";

export type AssetImportPreviewStatus = "ready" | "error" | "duplicate";

export type AssetImportBranchRow = {
  id: string;
  name: string;
  isDefault: boolean;
  isImportDefault: boolean;
  defaultAssetType: AssetType | null;
  defaultServiceIntervalMonths: number | null;
};

export type AssetImportPreviewRow = {
  line: number;
  status: AssetImportPreviewStatus;
  branch: string;
  customer: string;
  site: string;
  equipment: string;
  location: string;
  tag: string;
  detail: string;
};

export type AssetImportSummary = {
  total: number;
  ready: number;
  errors: number;
  duplicates: number;
  newAssets: number;
};

export type ResolvedAssetImportRow = {
  line: number;
  status: AssetImportPreviewStatus;
  preview: AssetImportPreviewRow;
  buildingId?: string;
  branchId?: string;
  row?: AssetImportRow;
};

type CustomerRow = { id: string; name: string; branchId: string };

type BuildingRow = {
  id: string;
  customerId: string;
  name: string | null;
  addressLine1: string;
  city: string;
  postalCode: string;
};

function assetDedupeKey(input: {
  buildingId: string;
  tagNumber?: string;
  location: string;
  assetType: AssetType;
}): string {
  const tag = input.tagNumber?.trim();
  if (tag) return `${input.buildingId}|tag|${normalizeNameKey(tag)}`;
  return `${input.buildingId}|loc|${normalizeNameKey(input.location)}|${input.assetType}`;
}

function resolveBuildingForRow(input: {
  customerId: string;
  row: AssetImportRow;
  buildingsForCustomer: BuildingRow[];
}): { buildingId: string; siteLabel: string } | { error: string } {
  const { row, buildingsForCustomer } = input;

  if (row.buildingName) {
    const key = normalizeNameKey(row.buildingName);
    const matches = buildingsForCustomer.filter(
      (b) => normalizeNameKey(b.name ?? "") === key,
    );
    if (matches.length === 0) {
      return {
        error: `No building named “${row.buildingName}” for this customer. Import buildings first.`,
      };
    }
    if (matches.length > 1) {
      return {
        error: `Multiple buildings named “${row.buildingName}”. Use address columns instead.`,
      };
    }
    const building = matches[0]!;
    return {
      buildingId: building.id,
      siteLabel: buildingLabel(building),
    };
  }

  const addrKey = buildingAddressKey({
    addressLine1: row.addressLine1!,
    city: row.city!,
    postalCode: row.postalCode!,
  });
  const matches = buildingsForCustomer.filter(
    (b) =>
      buildingAddressKey({
        addressLine1: b.addressLine1,
        city: b.city,
        postalCode: b.postalCode,
      }) === addrKey,
  );

  if (matches.length === 0) {
    return { error: "No building at this address for this customer. Import buildings first." };
  }
  if (matches.length > 1) {
    return { error: "Multiple buildings at this address. Add building_name to disambiguate." };
  }

  const building = matches[0]!;
  return { buildingId: building.id, siteLabel: buildingLabel(building) };
}

export function resolveAssetImportRows(input: {
  rows: Array<{ line: number; data: AssetImportRow }>;
  branches: AssetImportBranchRow[];
  customers: CustomerRow[];
  buildings: BuildingRow[];
  existingAssetKeys: Set<string>;
  defaultBranchId: string;
  role: AppRole;
  userBranchId: string | null;
}): { resolved: ResolvedAssetImportRow[]; summary: AssetImportSummary } {
  const { customersByBranch } = buildImportIndexes(input.customers);
  const buildingsByCustomerId = new Map<string, BuildingRow[]>();
  for (const building of input.buildings) {
    const list = buildingsByCustomerId.get(building.customerId) ?? [];
    list.push(building);
    buildingsByCustomerId.set(building.customerId, list);
  }

  const seenInFile = new Set<string>();
  const resolved: ResolvedAssetImportRow[] = [];

  let ready = 0;
  let errors = 0;
  let duplicates = 0;

  for (const { line, data } of input.rows) {
    const tagDisplay = data.tagNumber ?? "—";
    const basePreview: AssetImportPreviewRow = {
      line,
      status: "error",
      branch: data.branch || "—",
      customer: data.customer,
      site: data.buildingName ?? data.addressLine1 ?? "—",
      equipment: "—",
      location: data.location,
      tag: tagDisplay,
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

    const branchDefaults = input.branches.find((b) => b.id === branchResult.branchId);
    const assetType = data.assetType ?? branchDefaults?.defaultAssetType ?? null;
    if (!assetType) {
      errors += 1;
      resolved.push({
        line,
        status: "error",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          detail:
            "Equipment type is required. Add asset_type in CSV or set a default equipment type for this branch in Settings → Branches.",
        },
      });
      continue;
    }

    const equipment = assetTypeLabel(assetType);
    const rowWithType = { ...data, assetType };

    const customerKey = normalizeNameKey(data.customer);
    const branchCustomers = customersByBranch.get(branchResult.branchId);
    const customerMatches = branchCustomers?.get(customerKey) ?? [];

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
          detail: "Customer not found in this branch. Import customers and buildings first.",
        },
      });
      continue;
    }

    const customerId = customerMatches[0]!.id;
    const buildingResult = resolveBuildingForRow({
      customerId,
      row: rowWithType,
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
          site: data.buildingName ?? data.addressLine1 ?? "—",
          detail: buildingResult.error,
        },
      });
      continue;
    }

    const dedupeKey = assetDedupeKey({
      buildingId: buildingResult.buildingId,
      tagNumber: rowWithType.tagNumber,
      location: rowWithType.location,
      assetType,
    });

    if (seenInFile.has(dedupeKey)) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          equipment,
          status: "duplicate",
          detail: "Duplicate row in this file (same site, tag, or location + type).",
        },
      });
      continue;
    }
    seenInFile.add(dedupeKey);

    if (input.existingAssetKeys.has(dedupeKey)) {
      duplicates += 1;
      resolved.push({
        line,
        status: "duplicate",
        preview: {
          ...basePreview,
          branch: branchResult.branchLabel,
          site: buildingResult.siteLabel,
          equipment,
          status: "duplicate",
          detail: rowWithType.tagNumber
            ? "Equipment with this tag already exists on this site."
            : "Matching equipment already on this site (location + type).",
        },
        buildingId: buildingResult.buildingId,
        branchId: branchResult.branchId,
      });
      continue;
    }

    const intervalNote = branchDefaults?.defaultServiceIntervalMonths
      ? ` · next due +${branchDefaults.defaultServiceIntervalMonths} mo if blank`
      : "";

    ready += 1;
    resolved.push({
      line,
      status: "ready",
      preview: {
        ...basePreview,
        branch: branchResult.branchLabel,
        site: buildingResult.siteLabel,
        equipment,
        status: "ready",
        detail: `Will add to equipment register.${intervalNote}`,
      },
      buildingId: buildingResult.buildingId,
      branchId: branchResult.branchId,
      row: rowWithType,
    });
  }

  return {
    resolved,
    summary: {
      total: input.rows.length,
      ready,
      errors,
      duplicates,
      newAssets: ready,
    },
  };
}
