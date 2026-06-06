import { OperatingMarket } from "@prisma/client";
import { getLocaleForMarket } from "@/lib/market/operating-market";

export function formatQuoteCurrency(
  cents: number,
  currency: string,
  operatingMarket?: OperatingMarket,
): string {
  const locale =
    operatingMarket !== undefined
      ? getLocaleForMarket(operatingMarket)
      : currency === "GBP"
        ? "en-GB"
        : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
