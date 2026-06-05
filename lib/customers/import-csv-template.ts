import { rowsToCsv } from "@/lib/export/csv";

export const CUSTOMER_IMPORT_TEMPLATE_HEADERS = [
  "branch",
  "customer",
  "email",
  "phone",
  "building_name",
  "address_line1",
  "address_line2",
  "city",
  "region",
  "postal_code",
  "country",
  "fire_district",
  "permit_number",
  "permit_expires",
] as const;

export function customerImportTemplateCsv(): string {
  return rowsToCsv(CUSTOMER_IMPORT_TEMPLATE_HEADERS, [
    ["Main", "Acme Property Management", "billing@acme.example", "", "", "", "", "", "", "", "", "", "", ""],
    [
      "Main",
      "Acme Property Management",
      "",
      "",
      "Tower A",
      "100 Market St",
      "",
      "San Francisco",
      "CA",
      "94105",
      "US",
      "San Francisco Fire",
      "SP-2024-001",
      "2027-06-01",
    ],
    [
      "Main",
      "Acme Property Management",
      "",
      "",
      "Tower B",
      "200 Market St",
      "Suite 10",
      "San Francisco",
      "CA",
      "94105",
      "US",
      "",
      "",
      "",
    ],
    ["West", "Summit Facilities", "", "", "", "", "", "", "", "", "", "", "", ""],
  ]);
}
