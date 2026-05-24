import { z } from "zod";

const companyLogoUrlSchema = z.union([
  z.literal(""),
  z
    .string()
    .refine(
      (value) =>
        value.startsWith("data:image/jpeg") ||
        value.startsWith("data:image/png") ||
        value.startsWith("data:image/webp") ||
        value.startsWith("http://") ||
        value.startsWith("https://"),
      "Upload a PNG or JPEG logo.",
    )
    .refine(
      (value) => value.length <= 500_000,
      "Logo image is too large. Try a smaller file.",
    ),
]);

export const updateCompanyProfileSchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters."),
  logoUrl: companyLogoUrlSchema,
  reportEmail: z.union([
    z.literal(""),
    z.string().trim().email("Enter a valid report email."),
  ]),
  reportPhone: z.string().trim().max(40).optional().or(z.literal("")),
  reportAddress: z.string().trim().max(500).optional().or(z.literal("")),
});

export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;
