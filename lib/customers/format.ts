type BuildingAddressFields = {
  name: string | null;
  addressLine1: string;
  city: string;
};

type BuildingFullAddressFields = BuildingAddressFields & {
  addressLine2?: string | null;
  region: string;
  postalCode: string;
  country?: string;
};

export function buildingLabel(building: BuildingAddressFields): string {
  return building.name ?? `${building.addressLine1}, ${building.city}`;
}

export function buildingAddressLine(building: BuildingAddressFields): string {
  const label = buildingLabel(building);
  if (building.name) {
    return `${building.addressLine1}, ${building.city}`;
  }
  return label;
}

/** Multi-line postal address for field briefs and PDFs. */
export function formatBuildingAddress(building: BuildingFullAddressFields): string {
  const lines = [
    building.addressLine1,
    building.addressLine2?.trim() || null,
    `${building.city}, ${building.region} ${building.postalCode}`.trim(),
  ].filter(Boolean) as string[];
  if (building.country && building.country !== "US") {
    lines.push(building.country);
  }
  return lines.join("\n");
}
