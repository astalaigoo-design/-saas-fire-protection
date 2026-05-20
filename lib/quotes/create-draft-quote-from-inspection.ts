import { InspectionItemResult, QuoteStatus } from "@prisma/client";
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
          notes: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!inspection || inspection.items.length === 0) {
    return null;
  }

  const title = `${inspection.inspectionType.name} repair quote`;

  const quote = await prisma.quote.upsert({
    where: { inspectionId: inspection.id },
    update: {
      status: QuoteStatus.draft,
      title,
      notes: "Auto-generated from failed inspection items. Add pricing before sending.",
      lineItems: {
        deleteMany: {},
        create: inspection.items.map((item, index) => ({
          label: item.label,
          description:
            item.notes?.trim() ||
            "Repair required based on failed inspection checklist item.",
          quantity: 1,
          unitPriceCents: 0,
          sortOrder: index,
        })),
      },
      totalCents: 0,
    },
    create: {
      companyId: input.companyId,
      inspectionId: inspection.id,
      status: QuoteStatus.draft,
      title,
      notes: "Auto-generated from failed inspection items. Add pricing before sending.",
      lineItems: {
        create: inspection.items.map((item, index) => ({
          label: item.label,
          description:
            item.notes?.trim() ||
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
