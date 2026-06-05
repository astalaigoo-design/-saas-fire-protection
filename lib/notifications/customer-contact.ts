import { normalizeSmsPhone } from "@/lib/sms/normalize-phone";

export type CustomerContactInfo = {
  email: string | null;
  phoneE164: string | null;
};

export function resolveCustomerContact(input: {
  email?: string | null;
  phone?: string | null;
}): CustomerContactInfo {
  const email = input.email?.trim() || null;
  const phoneE164 = input.phone?.trim() ? normalizeSmsPhone(input.phone) : null;
  return { email, phoneE164 };
}
