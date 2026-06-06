import { InspectionItemResult, OperatingMarket, QuoteStatus } from "@prisma/client";
import { getDefaultCurrencyForMarket } from "@/lib/market/operating-market";
import { prisma } from "@/lib/prisma";

type CreateDraftQuoteInput = {
  companyId: string;
  inspectionId: string;
};

export async function createDraftQuoteFromInspection(
  input: CreateDraftQuoteInput,
): Promise<{ quoteId: string } | null> {
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: input.inspectionId,
      companyId: input.companyId,
    },
    select: {
      id: true,
      inspectionType: { select: { name: true } },
      items: {
        where: { result: InspectionItemResult.fail },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          description: true,
          notes: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!inspection || inspection.items.length === 0) {
    return null;
  }

  const company = await prisma.company.findFirst({
    where: { id: input.companyId },
    select: { operatingMarket: true },
  });
  const currency = getDefaultCurrencyForMarket(
    company?.operatingMarket ?? OperatingMarket.US,
  );

  const title = `${inspection.inspectionType.name} repair quote`;

  const quote = await prisma.quote.upsert({
    where: { inspectionId: inspection.id },
    update: {
      status: QuoteStatus.draft,
      title,
      notes: "Auto-generated from failed inspection items. Add pricing before sending.",
      subtotalCents: 0,
      taxRateBasisPoints: 0,
      taxCents: 0,
      discountCents: 0,
      lineItems: {
        deleteMany: {},
        create: inspection.items.map((item, index) => ({
          label: item.label,
          description:
            item.notes?.trim() ||
            item.description ||
            "Repair required based on failed inspection checklist item.",
          quantity: 1,
          unitPriceCents: 0,
          sortOrder: index,
        })),
      },
      sentTo: null,
      sentAt: null,
      sentMessageId: null,
      statusChangedAt: null,
      acceptedAt: null,
      declinedAt: null,
      totalCents: 0,
    },
    create: {
      companyId: input.companyId,
      inspectionId: inspection.id,
      currency,
      status: QuoteStatus.draft,
      title,
      notes: "Auto-generated from failed inspection items. Add pricing before sending.",
      subtotalCents: 0,
      taxRateBasisPoints: 0,
      taxCents: 0,
      discountCents: 0,
      lineItems: {
        create: inspection.items.map((item, index) => ({
          label: item.label,
          description:
            item.notes?.trim() ||
            item.description ||
            "Repair required based on failed inspection checklist item.",
          quantity: 1,
          unitPriceCents: 0,
          sortOrder: index,
        })),
      },
      totalCents: 0,
    },
    select: { id: true },
  });

  return { quoteId: quote.id };
}
