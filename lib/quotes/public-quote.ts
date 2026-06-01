import { InspectionStatus, QuoteStatus } from "@prisma/client";
import {
  resolvePublicCompanyBranding,
  type PublicCompanyBranding,
} from "@/lib/companies/public-branding";
import { buildingLabel } from "@/lib/customers/format";
import type { QuotePdfData } from "@/lib/quotes/queries";
import { prisma } from "@/lib/prisma";

const PUBLIC_QUOTE_STATUSES: QuoteStatus[] = [
  QuoteStatus.sent,
  QuoteStatus.accepted,
  QuoteStatus.declined,
];

const publicQuoteSelect = {
  id: true,
  shareToken: true,
  title: true,
  status: true,
  currency: true,
  subtotalCents: true,
  taxCents: true,
  discountCents: true,
  totalCents: true,
  createdAt: true,
  sentAt: true,
  lineItems: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      label: true,
      description: true,
      quantity: true,
      unitPriceCents: true,
    },
  },
  inspection: {
    select: {
      status: true,
      inspectionType: { select: { name: true } },
      company: {
        select: { name: true, logoUrl: true, reportEmail: true, reportPhone: true },
      },
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
};

export type PublicQuoteMeta = {
  shareToken: string;
  quoteId: string;
  quoteTitle: string;
  status: QuoteStatus;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  buildingLabel: string;
  customerName: string;
  companyName: string;
  companyEmail: string | null;
  inspectionTypeName: string;
  sentAt: Date | null;
  lineItems: Array<{
    label: string;
    description: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
};

function mapToPdfData(
  quote: NonNullable<Awaited<ReturnType<typeof fetchPublicQuoteRow>>>,
): QuotePdfData {
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

async function fetchPublicQuoteRow(shareToken: string) {
  return prisma.quote.findFirst({
    where: {
      shareToken,
      status: { in: PUBLIC_QUOTE_STATUSES },
      inspection: { status: InspectionStatus.completed },
    },
    select: publicQuoteSelect,
  });
}

export async function getPublicQuoteMeta(
  shareToken: string,
): Promise<PublicQuoteMeta | null> {
  const quote = await fetchPublicQuoteRow(shareToken);
  if (!quote?.shareToken) return null;

  return {
    shareToken: quote.shareToken,
    quoteId: quote.id,
    quoteTitle: quote.title ?? `${quote.inspection.inspectionType.name} repair quote`,
    status: quote.status,
    currency: quote.currency,
    subtotalCents: quote.subtotalCents,
    taxCents: quote.taxCents,
    discountCents: quote.discountCents,
    totalCents: quote.totalCents,
    buildingLabel: buildingLabel(quote.inspection.building),
    customerName: quote.inspection.building.customer.name,
    companyName: quote.inspection.company.name,
    branding: resolvePublicCompanyBranding(quote.inspection.company),
    companyEmail: quote.inspection.company.reportEmail,
    inspectionTypeName: quote.inspection.inspectionType.name,
    sentAt: quote.sentAt,
    lineItems: quote.lineItems,
  };
}

export async function getPublicQuotePdfData(
  shareToken: string,
): Promise<QuotePdfData | null> {
  const quote = await fetchPublicQuoteRow(shareToken);
  if (!quote) return null;
  return mapToPdfData(quote);
}
