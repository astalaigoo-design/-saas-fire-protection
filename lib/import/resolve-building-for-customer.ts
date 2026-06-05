import { buildingAddressKey, normalizeNameKey } from "@/lib/buildings/import-csv-resolve";
import { buildingLabel } from "@/lib/customers/format";

export type ImportBuildingRow = {
  buildingName?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
};

export type ImportBuildingLookupRow = {
  id: string;
  customerId: string;
  name: string | null;
  addressLine1: string;
  city: string;
  postalCode: string;
};

type BranchCustomerRow = { id: string; branchId: string; name: string };

export function resolveBuildingInBranch(input: {
  buildingName: string;
  branchId: string;
  customers: BranchCustomerRow[];
  buildings: ImportBuildingLookupRow[];
}): { buildingId: string; siteLabel: string; customerName: string } | { error: string } {
  const customerIdsInBranch = new Set(
    input.customers.filter((c) => c.branchId === input.branchId).map((c) => c.id),
  );
  const key = normalizeNameKey(input.buildingName);
  const matches = input.buildings.filter(
    (building) =>
      customerIdsInBranch.has(building.customerId) &&
      normalizeNameKey(building.name ?? "") === key,
  );

  if (matches.length === 0) {
    return {
      error: `No building named “${input.buildingName}” in this branch. Import buildings first or add customer.`,
    };
  }
  if (matches.length > 1) {
    return {
      error: `Multiple buildings named “${input.buildingName}” in this branch. Add customer to disambiguate.`,
    };
  }

  const building = matches[0]!;
  const customer = input.customers.find((row) => row.id === building.customerId);
  return {
    buildingId: building.id,
    siteLabel: buildingLabel(building),
    customerName: customer?.name ?? "—",
  };
}

export function resolveBuildingForImportRow(input: {
  row: ImportBuildingRow;
  buildingsForCustomer: ImportBuildingLookupRow[];
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
    return { buildingId: building.id, siteLabel: buildingLabel(building) };
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
