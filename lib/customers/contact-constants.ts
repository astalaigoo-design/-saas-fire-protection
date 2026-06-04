import { CustomerContactRole } from "@prisma/client";

export const CUSTOMER_CONTACT_ROLES = [
  { value: CustomerContactRole.billing, label: "Billing" },
  { value: CustomerContactRole.site, label: "Site / on-site" },
] as const;

export function customerContactRoleLabel(role: CustomerContactRole): string {
  return CUSTOMER_CONTACT_ROLES.find((r) => r.value === role)?.label ?? role;
}
