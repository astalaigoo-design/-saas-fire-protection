import { buildingLabel } from "@/lib/customers/format";

type BuildingAddress = {
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export function buildingFullAddress(building: BuildingAddress): string[] {
  const lines: string[] = [];
  if (building.addressLine2) {
    lines.push(building.addressLine1);
    lines.push(building.addressLine2);
  } else {
    lines.push(building.addressLine1);
  }
  lines.push(`${building.city}, ${building.region} ${building.postalCode}`);
  if (building.country && building.country !== "US") {
    lines.push(building.country);
  }
  return lines;
}

export function buildingDisplayName(building: BuildingAddress): string {
  return buildingLabel(building);
}
