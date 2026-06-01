import { SubscriptionStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { addTrialDays } from "@/lib/billing/access";
import { DEFAULT_BOOTSTRAP_INSPECTION_TYPES } from "@/lib/inspections/inspection-type-templates";
import { prisma } from "@/lib/prisma";

/** @deprecated Use DEFAULT_BOOTSTRAP_INSPECTION_TYPES from inspection-type-templates. */
export const DEFAULT_INSPECTION_TYPES = DEFAULT_BOOTSTRAP_INSPECTION_TYPES.map(
  (template) => ({ code: template.code, name: template.name }),
);

export async function createCompanyWithDefaults(
  name: string,
  tx?: Prisma.TransactionClient,
): Promise<{ id: string; name: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Company name is required.");
  }

  const client = tx ?? prisma;

  const company = await client.company.create({
    data: {
      name: trimmed,
      trialEndsAt: addTrialDays(),
      subscriptionStatus: SubscriptionStatus.trialing,
    },
    select: { id: true, name: true },
  });

  await client.inspectionType.createMany({
    data: DEFAULT_BOOTSTRAP_INSPECTION_TYPES.map((type) => ({
      companyId: company.id,
      code: type.code,
      name: type.name,
    })),
  });

  return company;
}
