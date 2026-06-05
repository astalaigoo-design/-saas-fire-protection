import { z } from "zod";
import { canonicalizeImportHeader as canonicalizeBuildingImportHeader } from "@/lib/buildings/import-csv-schemas";
import { parseDateInputValue } from "@/lib/scheduling/calendar";

export const CUSTOMER_IMPORT_MAX_ROWS = 200;
export const CUSTOMER_IMPORT_MAX_BYTES = 512_000;

const HEADER_ALIASES: Record<string, string> = {
  branch: "branch",
  branch_name: "branch",
  office: "branch",
  location: "branch",
  customer: "customer",
  customer_name: "customer",
  name: "customer",
  client: "customer",
  account: "customer",
  customer_email: "email",
  email: "email",
  customer_phone: "phone",
  phone: "phone",
};

const CUSTOMER_ONLY_HEADERS = new Set(["branch", "customer", "email", "phone"]);

export function canonicalizeCustomerImportHeader(header: string): string {
  const key = HEADER_ALIASES[header] ?? header;
  if (CUSTOMER_ONLY_HEADERS.has(key)) return key;
  return canonicalizeBuildingImportHeader(key);
}

export const customerImportRowSchema = z
  .object({
    branch: z.string().trim().max(100).optional().default(""),
    customer: z.string().trim().min(1, "Customer name is required").max(200),
    email: z.string().trim().max(320).optional().default(""),
    phone: z.string().trim().max(50).optional().default(""),
    building_name: z.string().trim().max(200).optional().default(""),
    address_line1: z.string().trim().max(200).optional().default(""),
    address_line2: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().max(100).optional().default(""),
    region: z.string().trim().max(50).optional().default(""),
    postal_code: z.string().trim().max(20).optional().default(""),
    country: z.string().trim().min(2).max(2).optional().default("US"),
    fire_district: z.string().trim().max(200).optional().default(""),
    permit_number: z.string().trim().max(100).optional().default(""),
    permit_expires: z.string().trim().max(32).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const hasAnySiteField =
      Boolean(data.building_name.trim()) ||
      Boolean(data.address_line1.trim()) ||
      Boolean(data.address_line2.trim()) ||
      Boolean(data.city.trim()) ||
      Boolean(data.region.trim()) ||
      Boolean(data.postal_code.trim()) ||
      Boolean(data.fire_district.trim()) ||
      Boolean(data.permit_number.trim()) ||
      Boolean(data.permit_expires.trim());

    if (!hasAnySiteField) return;

    const missing: string[] = [];
    if (!data.address_line1.trim()) missing.push("address_line1");
    if (!data.city.trim()) missing.push("city");
    if (!data.region.trim()) missing.push("region");
    if (!data.postal_code.trim()) missing.push("postal_code");
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Building rows need ${missing.join(", ")}.`,
      });
    }

    if (data.permit_expires.trim() && !parseDateInputValue(data.permit_expires)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid permit_expires date (use YYYY-MM-DD).",
        path: ["permit_expires"],
      });
    }
  })
  .transform((data) => {
    const hasBuildingSite =
      Boolean(data.address_line1.trim()) &&
      Boolean(data.city.trim()) &&
      Boolean(data.region.trim()) &&
      Boolean(data.postal_code.trim());

    return {
      branch: data.branch,
      name: data.customer,
      email: data.email || undefined,
      phone: data.phone || undefined,
      hasBuildingSite,
      buildingName: data.building_name || undefined,
      addressLine1: data.address_line1 || undefined,
      addressLine2: data.address_line2 || undefined,
      city: data.city || undefined,
      region: data.region || undefined,
      postalCode: data.postal_code || undefined,
      country: data.country.toUpperCase(),
      fireDistrict: data.fire_district || undefined,
      permitNumber: data.permit_number || undefined,
      permitExpiresAt: data.permit_expires
        ? parseDateInputValue(data.permit_expires)
        : null,
    };
  })
  .refine(
    (data) => !data.email || z.string().email().safeParse(data.email).success,
    { message: "Invalid email", path: ["email"] },
  );

export type CustomerImportRow = z.infer<typeof customerImportRowSchema>;

export const customerImportActionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("preview"),
    csv: z.string().max(CUSTOMER_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
  z.object({
    mode: z.literal("commit"),
    csv: z.string().max(CUSTOMER_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
]);
