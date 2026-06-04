import { CustomerContactRole } from "@prisma/client";
import { z } from "zod";

const contactFields = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    email: z.string().trim().max(320),
    phone: z.string().trim().max(50),
    role: z.nativeEnum(CustomerContactRole),
    notes: z.string().trim().max(2000),
  })
  .transform((data) => ({
    name: data.name,
    email: data.email === "" ? undefined : data.email,
    phone: data.phone === "" ? undefined : data.phone,
    role: data.role,
    notes: data.notes === "" ? undefined : data.notes,
  }))
  .refine(
    (data) => !data.email || z.string().email().safeParse(data.email).success,
    { message: "Enter a valid email", path: ["email"] },
  );

export const createCustomerContactSchema = contactFields.extend({
  customerId: z.string().cuid("Invalid customer."),
});

export const updateCustomerContactSchema = contactFields.extend({
  contactId: z.string().cuid("Invalid contact."),
});

export const deleteCustomerContactSchema = z.object({
  contactId: z.string().cuid("Invalid contact."),
});

export const mergeCustomersSchema = z.object({
  sourceCustomerId: z.string().cuid("Invalid customer."),
  targetCustomerId: z.string().cuid("Invalid customer."),
});
