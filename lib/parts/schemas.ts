import { z } from "zod";

export const createPartSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(80),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  unitCents: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v) return 0;
      const n = Number.parseInt(v, 10);
      return Number.isInteger(n) && n >= 0 ? n : "invalid" as const;
    }),
  quantityOnHand: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v) return 0;
      const n = Number.parseInt(v, 10);
      return Number.isInteger(n) && n >= 0 ? n : "invalid" as const;
    }),
});

export const updatePartSchema = createPartSchema.extend({
  partId: z.string().cuid(),
});

export const adjustPartStockSchema = z.object({
  partId: z.string().cuid(),
  delta: z
    .string()
    .trim()
    .transform((v) => {
      const n = Number.parseInt(v, 10);
      return Number.isInteger(n) ? n : ("invalid" as const);
    }),
});
