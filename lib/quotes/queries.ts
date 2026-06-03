import { branchScopeFromSession, quoteWhereFromScope } from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";
import { buildingLabel } from "@/lib/customers/format";

export type QuotePdfLineItem = {
  label: string;
  description: string | null;
  quantity: number;
  unitPriceCents: number;
};

export type QuotePdfData = {
  quoteId: string;
  quoteTitle: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: Date;
  companyName: string;
  logoUrl: string | null;
  customerName: string;
  buildingLabel: string;
  inspectionTypeName: string;
  lineItems: QuotePdfLineItem[];
};

export async function getQuotePdfData(
  session: DashboardSession,
  quoteId: string,
): Promise<QuotePdfData | null> {
  const scope = branchScopeFromSession(session);
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, ...quoteWhereFromScope(scope, session.companyId) },
    select: {
      id: true,
      title: true,
      currency: true,
      subtotalCents: true,
      taxCents: true,
      discountCents: true,
      totalCents: true,
      createdAt: true,
      lineItems: {
        orderBy: { sortOrder: "asc" },
        select: {
          label: true,
          description: true,
          quantity: true,
          unitPriceCents: true,
        },
      },
      inspection: {
        select: {
          inspectionType: { select: { name: true } },
          company: { select: { name: true, logoUrl: true } },
          building: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              customer: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!quote) return null;

  return {
    quoteId: quote.id,
    quoteTitle: quote.title ?? `${quote.inspection.inspectionType.name} repair quote`,
    currency: quote.currency,
    subtotalCents: quote.subtotalCents,
    taxCents: quote.taxCents,
    discountCents: quote.discountCents,
    totalCents: quote.totalCents,
    createdAt: quote.createdAt,
    companyName: quote.inspection.company.name,
    logoUrl: quote.inspection.company.logoUrl,
    customerName: quote.inspection.building.customer.name,
    buildingLabel: buildingLabel(quote.inspection.building),
    inspectionTypeName: quote.inspection.inspectionType.name,
    lineItems: quote.lineItems,
  };
}
