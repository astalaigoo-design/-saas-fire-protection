import { rowsToCsv } from "@/lib/export/csv";

export const CUSTOMER_IMPORT_TEMPLATE_HEADERS = [
  "branch",
  "customer",
  "email",
  "phone",
] as const;

export function customerImportTemplateCsv(): string {
  return rowsToCsv(CUSTOMER_IMPORT_TEMPLATE_HEADERS, [
    ["Main", "Acme Property Management", "billing@acme.example", ""],
    ["Main", "Riverside HOA", "contact@riverside.example", "+1 555 010 0200"],
    ["West", "Summit Facilities", "", ""],
  ]);
}
