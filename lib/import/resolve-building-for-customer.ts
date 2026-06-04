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
