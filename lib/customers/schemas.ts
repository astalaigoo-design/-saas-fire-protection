import { z } from "zod";

export const customerSearchParamsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  buildings: z.enum(["all", "with", "without"]).default("all"),
  sort: z.enum(["name_asc", "name_desc", "newest"]).default("name_asc"),
});

export type CustomerSearchParams = z.infer<typeof customerSearchParamsSchema>;

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    email: z.string().trim().max(320),
    phone: z.string().trim().max(50),
  })
  .transform((data) => ({
    name: data.name,
    email: data.email === "" ? undefined : data.email,
    phone: data.phone === "" ? undefined : data.phone,
  }))
  .refine(
    (data) => !data.email || z.string().email().safeParse(data.email).success,
    { message: "Enter a valid email", path: ["email"] },
  );

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export function parseCustomerSearchParams(
  raw: Record<string, string | string[] | undefined>,
): CustomerSearchParams {
  const pick = (key: string) => {
    const value = raw[key];
    return typeof value === "string" ? value : undefined;
  };

  const parsed = customerSearchParamsSchema.safeParse({
    q: pick("q"),
    buildings: pick("buildings"),
    sort: pick("sort"),
  });

  return parsed.success ? parsed.data : customerSearchParamsSchema.parse({});
}
