import { rowsToCsv } from "@/lib/export/csv";

export const SCHEDULE_IMPORT_TEMPLATE_HEADERS = [
  "branch",
  "customer",
  "building",
  "inspection_type",
  "scheduled_date",
  "scheduled_time",
  "technician",
  "recurrence",
  "notes",
] as const;

export function scheduleImportTemplateCsv(): string {
  return rowsToCsv(SCHEDULE_IMPORT_TEMPLATE_HEADERS, [
    [
      "Main",
      "Acme Property Management",
      "Tower A",
      "annual",
      "2026-07-15",
      "09:00",
      "tech@yourcompany.com",
      "none",
      "Q3 annual — wet system",
    ],
    [
      "Main",
      "Acme Property Management",
      "Tower B",
      "annual",
      "2026-07-16",
      "09:00",
      "tech@yourcompany.com",
      "none",
      "",
    ],
    [
      "Main",
      "",
      "Riverside Plaza",
      "annual",
      "2026-08-01",
      "10:30",
      "",
      "none",
      "customer optional when building name is unique in branch",
    ],
    [
      "Main",
      "Acme Property Management",
      "Harbor West",
      "quarterly",
      "2026-07-22",
      "14:00",
      "",
      "none",
      "",
    ],
  ]);
}
