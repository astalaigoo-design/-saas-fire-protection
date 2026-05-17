import type { InspectionItemResult } from "@prisma/client";

const reportDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatReportDate(date: Date): string {
  return reportDateFormatter.format(date);
}

export function formatResultLabel(result: InspectionItemResult): string {
  switch (result) {
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "na":
      return "N/A";
    default:
      return "Pending";
  }
}

export function buildingAddressLines(building: {
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
}): string[] {
  const lines: string[] = [];
  if (building.name) lines.push(building.name);
  lines.push(building.addressLine1);
  if (building.addressLine2) lines.push(building.addressLine2);
  lines.push(`${building.city}, ${building.region} ${building.postalCode}`);
  return lines;
}
