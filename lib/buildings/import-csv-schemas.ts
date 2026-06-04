import { z } from "zod";

export const BUILDING_IMPORT_MAX_ROWS = 200;
export const BUILDING_IMPORT_MAX_BYTES = 512_000;

const HEADER_ALIASES: Record<string, string> = {
  branch: "branch",
  branch_name: "branch",
  office: "branch",
  location: "branch",
  customer: "customer",
  customer_name: "customer",
  client: "customer",
  account: "customer",
  building_name: "building_name",
  site_name: "building_name",
  site: "building_name",
  name: "building_name",
  address_line1: "address_line1",
  address1: "address_line1",
  street: "address_line1",
  street_address: "address_line1",
  address_line2: "address_line2",
  address2: "address_line2",
  city: "city",
  region: "region",
  state: "region",
  province: "region",
  postal_code: "postal_code",
  zip: "postal_code",
  zip_code: "postal_code",
  country: "country",
  customer_email: "customer_email",
  email: "customer_email",
  customer_phone: "customer_phone",
  phone: "customer_phone",
};

export function canonicalizeImportHeader(header: string): string {
  return HEADER_ALIASES[header] ?? header;
}

export const buildingImportRowSchema = z
  .object({
    branch: z.string().trim().max(100).optional().default(""),
    customer: z.string().trim().min(1, "Customer name is required").max(200),
    building_name: z.string().trim().max(200).optional().default(""),
    address_line1: z.string().trim().min(1, "Address line 1 is required").max(200),
    address_line2: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().min(1, "City is required").max(100),
    region: z.string().trim().min(1, "State / region is required").max(50),
    postal_code: z.string().trim().min(1, "Postal code is required").max(20),
    country: z.string().trim().min(2).max(2).optional().default("US"),
    customer_email: z.string().trim().max(320).optional().default(""),
    customer_phone: z.string().trim().max(50).optional().default(""),
  })
  .transform((data) => ({
    branch: data.branch,
    customer: data.customer,
    buildingName: data.building_name || undefined,
    addressLine1: data.address_line1,
    addressLine2: data.address_line2 || undefined,
    city: data.city,
    region: data.region,
    postalCode: data.postal_code,
    country: data.country.toUpperCase(),
    customerEmail: data.customer_email || undefined,
    customerPhone: data.customer_phone || undefined,
  }))
  .refine(
    (data) => !data.customerEmail || z.string().email().safeParse(data.customerEmail).success,
    { message: "Invalid customer email", path: ["customer_email"] },
  );

export type BuildingImportRow = z.infer<typeof buildingImportRowSchema>;

export const buildingImportActionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("preview"),
    csv: z.string().max(BUILDING_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
  z.object({
    mode: z.literal("commit"),
    csv: z.string().max(BUILDING_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
]);

export type BuildingImportActionInput = z.infer<typeof buildingImportActionSchema>;
