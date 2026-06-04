import { z } from "zod";
import { normalizeSmsPhone } from "@/lib/sms/normalize-phone";

export const technicianPhoneSchema = z
  .string()
  .trim()
  .max(30)
  .transform((value, ctx) => {
    if (!value) return null;
    const normalized = normalizeSmsPhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid mobile number (e.g. +1 555 123 4567).",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const updateTeamMemberPhoneSchema = z.object({
  userId: z.string().min(1),
  phone: technicianPhoneSchema,
});

export const updateMyPhoneSchema = z.object({
  phone: technicianPhoneSchema,
});
