import { createReportShareToken } from "@/lib/reports/share-token";
import { prisma } from "@/lib/prisma";

export function createCustomerPortalToken(): string {
  return createReportShareToken();
}

export async function ensureCustomerPortalToken(customerId: string): Promise<string> {
  const existing = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { portalToken: true },
  });
  if (existing?.portalToken) return existing.portalToken;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const portalToken = createCustomerPortalToken();
    try {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { portalToken, portalEnabledAt: new Date() },
        select: { portalToken: true },
      });
      return updated.portalToken!;
    } catch {
      /* collision */
    }
  }

  throw new Error("Could not assign a customer portal token.");
}
