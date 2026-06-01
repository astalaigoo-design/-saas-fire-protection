import { describe, expect, it } from "vitest";
import { recalculateQuoteTotals } from "@/lib/quotes/totals";

describe("recalculateQuoteTotals", () => {
  it("sums line items into subtotal", () => {
    const result = recalculateQuoteTotals({
      lineItems: [
        { quantity: 2, unitPriceCents: 1500 },
        { quantity: 1, unitPriceCents: 500 },
      ],
      taxRateBasisPoints: 0,
      discountCents: 0,
    });
    expect(result.subtotalCents).toBe(3500);
    expect(result.taxCents).toBe(0);
    expect(result.totalCents).toBe(3500);
  });

  it("applies tax in basis points and discount", () => {
    const result = recalculateQuoteTotals({
      lineItems: [{ quantity: 1, unitPriceCents: 10_000 }],
      taxRateBasisPoints: 850,
      discountCents: 500,
    });
    expect(result.subtotalCents).toBe(10_000);
    expect(result.taxCents).toBe(850);
    expect(result.totalCents).toBe(10_350);
  });

  it("never returns a negative total", () => {
    const result = recalculateQuoteTotals({
      lineItems: [{ quantity: 1, unitPriceCents: 1000 }],
      taxRateBasisPoints: 0,
      discountCents: 5000,
    });
    expect(result.totalCents).toBe(0);
  });
});
