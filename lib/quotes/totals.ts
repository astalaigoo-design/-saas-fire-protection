export type QuoteLineTotalInput = {
  quantity: number;
  unitPriceCents: number;
};

export function recalculateQuoteTotals(input: {
  lineItems: QuoteLineTotalInput[];
  taxRateBasisPoints: number;
  discountCents: number;
}): { subtotalCents: number; taxCents: number; totalCents: number } {
  const subtotalCents = input.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const taxCents = Math.round((subtotalCents * input.taxRateBasisPoints) / 10_000);
  const totalCents = Math.max(0, subtotalCents + taxCents - input.discountCents);
  return { subtotalCents, taxCents, totalCents };
}
