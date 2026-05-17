type BuildingAddressFields = {
  name: string | null;
  addressLine1: string;
  city: string;
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
