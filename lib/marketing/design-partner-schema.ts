import { z } from "zod";

export const designPartnerApplicationSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactName: z.string().trim().min(1, "Your name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  teamSize: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  message: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type DesignPartnerApplicationInput = z.infer<typeof designPartnerApplicationSchema>;
