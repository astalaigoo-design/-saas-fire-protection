import { CustomerContactRole } from "@prisma/client";
import { z } from "zod";

const contactFieldsInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().max(320),
  phone: z.string().trim().max(50),
  role: z.nativeEnum(CustomerContactRole),
  notes: z.string().trim().max(2000),
});

function normalizeContactFields(data: z.infer<typeof contactFieldsInput>) {
  return {
    name: data.name,
    email: data.email === "" ? undefined : data.email,
    phone: data.phone === "" ? undefined : data.phone,
    role: data.role,
    notes: data.notes === "" ? undefined : data.notes,
  };
}

function refineContactEmail<T extends { email?: string }>(schema: z.ZodType<T>) {
  return schema.refine(
    (data) => !data.email || z.string().email().safeParse(data.email).success,
    { message: "Enter a valid email", path: ["email"] },
  );
}

export const contactFields = refineContactEmail(
  contactFieldsInput.transform(normalizeContactFields),
);

export const createCustomerContactSchema = refineContactEmail(
  contactFieldsInput
    .extend({
      customerId: z.string().cuid("Invalid customer."),
    })
    .transform((data) => ({
      customerId: data.customerId,
      ...normalizeContactFields(data),
    })),
);

export const updateCustomerContactSchema = refineContactEmail(
  contactFieldsInput
    .extend({
      contactId: z.string().cuid("Invalid contact."),
    })
    .transform((data) => ({
      contactId: data.contactId,
      ...normalizeContactFields(data),
    })),
);

export const deleteCustomerContactSchema = z.object({
  contactId: z.string().cuid("Invalid contact."),
});

export const mergeCustomersSchema = z.object({
  sourceCustomerId: z.string().cuid("Invalid customer."),
  targetCustomerId: z.string().cuid("Invalid customer."),
});
