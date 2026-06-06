import { OperatingMarket, SubscriptionStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { addTrialDays } from "@/lib/billing/access";
import { ensureDefaultBranchForCompany } from "@/lib/branches/default-branch";
import { getBootstrapInspectionTypesForMarket } from "@/lib/market/inspection-type-labels";
import { DEFAULT_BOOTSTRAP_INSPECTION_TYPES } from "@/lib/inspections/inspection-type-templates";
import { prisma } from "@/lib/prisma";

/** @deprecated Use DEFAULT_BOOTSTRAP_INSPECTION_TYPES from inspection-type-templates. */
export const DEFAULT_INSPECTION_TYPES = DEFAULT_BOOTSTRAP_INSPECTION_TYPES.map(
  (template) => ({ code: template.code, name: template.name }),
);

export type CreateCompanyOptions = {
  operatingMarket?: OperatingMarket;
};

export async function createCompanyWithDefaults(
  name: string,
  tx?: Prisma.TransactionClient,
  options?: CreateCompanyOptions,
): Promise<{ id: string; name: string; operatingMarket: OperatingMarket }> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Company name is required.");
  }

  const operatingMarket = options?.operatingMarket ?? OperatingMarket.US;
  const client = tx ?? prisma;

  const company = await client.company.create({
    data: {
      name: trimmed,
      trialEndsAt: addTrialDays(),
      subscriptionStatus: SubscriptionStatus.trialing,
      operatingMarket,
    },
    select: { id: true, name: true, operatingMarket: true },
  });

  const bootstrapTypes = getBootstrapInspectionTypesForMarket(operatingMarket);

  await client.inspectionType.createMany({
    data: bootstrapTypes.map((type) => ({
      companyId: company.id,
      code: type.code,
      name: type.name,
    })),
  });

  await ensureDefaultBranchForCompany(company.id, client);

  return company;
}
