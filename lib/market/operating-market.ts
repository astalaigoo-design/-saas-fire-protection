import { OperatingMarket } from "@prisma/client";

export const OPERATING_MARKETS = [OperatingMarket.US, OperatingMarket.UK] as const;

export type MarketConfig = {
  defaultCountry: string;
  defaultCurrency: string;
  locale: string;
  regionLabel: string;
  postalCodeLabel: string;
  checklistResetLabel: string;
  checklistPackHeading: string;
  checklistPackDescription: string;
  scheduleChecklistHint: string;
  complianceFrameworkLabel: string;
};

export const MARKET_CONFIG: Record<OperatingMarket, MarketConfig> = {
  [OperatingMarket.US]: {
    defaultCountry: "US",
    defaultCurrency: "USD",
    locale: "en-US",
    regionLabel: "State",
    postalCodeLabel: "ZIP code",
    checklistResetLabel: "Reset to NFPA defaults",
    checklistPackHeading: "NFPA checklist packs",
    checklistPackDescription:
      "Enable focused NFPA 25 / 72 / 96 system packs — wet pipe, dry pipe, sprinkler, fire alarm, and commercial kitchen.",
    scheduleChecklistHint:
      "Checklist items are created automatically from NFPA rules for the selected type (cadence or system pack).",
    complianceFrameworkLabel: "NFPA",
  },
  [OperatingMarket.UK]: {
    defaultCountry: "GB",
    defaultCurrency: "GBP",
    locale: "en-GB",
    regionLabel: "County",
    postalCodeLabel: "Postcode",
    checklistResetLabel: "Reset to UK defaults",
    checklistPackHeading: "BS / UK checklist packs",
    checklistPackDescription:
      "Enable focused BS EN 12845, BS 5839, and kitchen suppression packs aligned to UK fire safety practice.",
    scheduleChecklistHint:
      "Checklist items are created automatically from UK / BS guidance for the selected type (cadence or system pack).",
    complianceFrameworkLabel: "BS / UK fire safety",
  },
};

export function getMarketConfig(market: OperatingMarket): MarketConfig {
  return MARKET_CONFIG[market];
}

export function parseOperatingMarket(value: unknown): OperatingMarket {
  if (value === OperatingMarket.UK || value === "UK") {
    return OperatingMarket.UK;
  }
  return OperatingMarket.US;
}

export function getDefaultCountryForMarket(market: OperatingMarket): string {
  return getMarketConfig(market).defaultCountry;
}

export function getDefaultCurrencyForMarket(market: OperatingMarket): string {
  return getMarketConfig(market).defaultCurrency;
}

export function getLocaleForMarket(market: OperatingMarket): string {
  return getMarketConfig(market).locale;
}

export function formatMoneyForMarket(
  cents: number,
  market: OperatingMarket,
  currency?: string,
): string {
  const config = getMarketConfig(market);
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: currency ?? config.defaultCurrency,
  }).format(cents / 100);
}

export const OPERATING_MARKET_LABELS: Record<OperatingMarket, string> = {
  [OperatingMarket.US]: "United States (NFPA)",
  [OperatingMarket.UK]: "United Kingdom (BS / UK fire safety)",
};
