import { rowsToCsv } from "@/lib/export/csv";

export const SCHEDULE_IMPORT_TEMPLATE_HEADERS = [
  "branch",
  "customer",
  "building_name",
  "address_line1",
  "city",
  "postal_code",
  "inspection_type",
  "scheduled_date",
  "scheduled_time",
  "technician_email",
  "recurrence",
  "notes",
] as const;

export function scheduleImportTemplateCsv(): string {
  return rowsToCsv(SCHEDULE_IMPORT_TEMPLATE_HEADERS, [
    [
      "Main",
      "Acme Property Management",
      "Tower A",
      "100 Market St",
      "San Francisco",
      "94105",
      "annual",
      "2026-07-15",
      "09:00",
      "tech@yourcompany.com",
      "none",
      "Annual wet system",
    ],
    [
      "Main",
      "Acme Property Management",
      "Tower B",
      "200 Market St",
      "San Francisco",
      "94105",
      "quarterly",
      "2026-07-16",
      "10:30",
      "",
      "none",
      "",
    ],
  ]);
}
