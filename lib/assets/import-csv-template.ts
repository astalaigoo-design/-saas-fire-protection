import { rowsToCsv } from "@/lib/export/csv";

export const ASSET_IMPORT_TEMPLATE_HEADERS = [
  "branch",
  "customer",
  "building_name",
  "address_line1",
  "city",
  "postal_code",
  "asset_type",
  "location",
  "tag_number",
  "manufacturer",
  "model",
  "serial_number",
  "last_service_at",
  "next_service_due",
  "notes",
] as const;

export function assetImportTemplateCsv(): string {
  return rowsToCsv(ASSET_IMPORT_TEMPLATE_HEADERS, [
    [
      "Main",
      "Acme Property Management",
      "Tower A",
      "100 Market St",
      "San Francisco",
      "94105",
      "fire_extinguisher",
      "2nd floor · east stair",
      "FE-1042",
      "Amerex",
      "",
      "",
      "2025-06-01",
      "2026-06-01",
      "",
    ],
    [
      "Main",
      "Acme Property Management",
      "Tower A",
      "100 Market St",
      "San Francisco",
      "94105",
      "fire_alarm_panel",
      "Main lobby",
      "PANEL-1",
      "",
      "",
      "",
      "",
      "",
      "FACP",
    ],
  ]);
}
