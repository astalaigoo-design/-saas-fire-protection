import { z } from "zod";

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

export function canonicalizeCustomerImportHeader(header: string): string {
  return HEADER_ALIASES[header] ?? header;
}

export const customerImportRowSchema = z
  .object({
    branch: z.string().trim().max(100).optional().default(""),
    customer: z.string().trim().min(1, "Customer name is required").max(200),
    email: z.string().trim().max(320).optional().default(""),
    phone: z.string().trim().max(50).optional().default(""),
  })
  .transform((data) => ({
    branch: data.branch,
    name: data.customer,
    email: data.email || undefined,
    phone: data.phone || undefined,
  }))
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
