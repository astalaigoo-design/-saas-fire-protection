/** Product display name (UI, metadata, emails). */
export const APP_NAME = "GetFlareflow";

/** Primary positioning line (hero, marketing, metadata). */
export const APP_POSITIONING =
  "The operating system for fire protection contractors — from NFPA field inspection to client-ready report and repair quote.";

/** Short label for eyebrow / compact UI. */
export const APP_TAGLINE = "Operating system for fire protection contractors";

export const APP_DESCRIPTION = APP_POSITIONING;

/** Pricing shown on marketing and billing. */
export const PILOT_PRICING = {
  standard: {
    label: "GetFlareflow",
    price: "$49",
    period: "/mo",
    detail:
      "Full platform for fire protection contractors — field inspections, compliance reports, and repair quotes.",
  },
  designPartner: {
    label: "Design partner",
    price: "$0",
    period: "/mo",
    detail: "For 2–3 early contractors helping shape the product.",
    limitNote: "Limited to 2–3 companies.",
  },
} as const;

export const PILOT_SUPPORT_EMAIL = "support@getflareflow.com";

/** Public marketing route for design partner intake (separate from /sign-up). */
export const DESIGN_PARTNER_APPLY_PATH = "/design-partner";

/** Default demo tenant name in seed scripts. */
export const DEMO_COMPANY_NAME = "GetFlareflow Demo Co.";

/** Production shared demo workspace (legacy name in DB). */
export const SHARED_DEMO_COMPANY_ID = "cmpc93rk30000tkngtmv98mra";
export const SHARED_DEMO_COMPANY_NAME = "GetFlareflow";
