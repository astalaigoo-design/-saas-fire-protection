import { QuoteStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { computeQuotePipelineMetrics } from "@/lib/quotes/pipeline";
import type { QuoteListItem } from "@/lib/dashboard/queries";

function mockQuote(
  overrides: Partial<QuoteListItem> & { status: QuoteListItem["status"]; totalCents?: number },
): QuoteListItem {
  return {
    id: "q1",
    title: "Repair",
    notes: null,
    subtotalCents: 10_000,
    taxRateBasisPoints: 0,
    taxCents: 0,
    discountCents: 0,
    totalCents: overrides.totalCents ?? 10_000,
    currency: "USD",
    createdAt: new Date(),
    sentTo: null,
    sentAt: null,
    acceptedAt: null,
    declinedAt: null,
    scheduledInspectionId: null,
    repairInvoice: null,
    shareToken: "tok",
    lineItems: [],
    inspection: {
      id: "insp-1",
      inspectionType: { name: "Annual" },
      completedAt: new Date(),
      company: { reportEmail: null, name: "Co" },
      building: {
        id: "b1",
        name: "Site",
        addressLine1: "1 Main",
        city: "Oakland",
        customer: { name: "Customer", email: null },
      },
    },
    ...overrides,
  };
}

describe("computeQuotePipelineMetrics", () => {
  it("sums open pipeline as draft plus sent", () => {
    const metrics = computeQuotePipelineMetrics([
      mockQuote({ id: "a", status: QuoteStatus.draft, totalCents: 50_000 }),
      mockQuote({ id: "b", status: QuoteStatus.sent, totalCents: 30_000 }),
      mockQuote({ id: "c", status: QuoteStatus.accepted, totalCents: 100_000 }),
    ]);
    expect(metrics.openPipelineCents).toBe(80_000);
    expect(metrics.counts.draft).toBe(1);
    expect(metrics.counts.awaiting).toBe(1);
  });

  it("computes conversion from accepted and declined only", () => {
    const metrics = computeQuotePipelineMetrics([
      mockQuote({ id: "a", status: QuoteStatus.accepted }),
      mockQuote({ id: "b", status: QuoteStatus.declined }),
      mockQuote({ id: "c", status: QuoteStatus.sent }),
    ]);
    expect(metrics.conversionPercent).toBe(50);
  });
});
