import { rowsToCsv } from "@/lib/export/csv";

export const BUILDING_IMPORT_TEMPLATE_HEADERS = [
  "branch",
  "customer",
  "building_name",
  "address_line1",
  "address_line2",
  "city",
  "region",
  "postal_code",
  "country",
  "customer_email",
  "customer_phone",
] as const;

export function buildingImportTemplateCsv(): string {
  return rowsToCsv(BUILDING_IMPORT_TEMPLATE_HEADERS, [
    [
      "Main",
      "Acme Property Management",
      "Tower A",
      "100 Market St",
      "",
      "San Francisco",
      "CA",
      "94105",
      "US",
      "billing@acme.example",
      "",
    ],
    [
      "Main",
      "Acme Property Management",
      "Tower B",
      "200 Market St",
      "Suite 10",
      "San Francisco",
      "CA",
      "94105",
      "US",
      "",
      "",
    ],
  ]);
}
