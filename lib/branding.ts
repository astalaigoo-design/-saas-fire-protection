/** Product display name (UI, metadata, emails). */
export const APP_NAME = "GetFlareflow";

/** Primary positioning line (hero, marketing, metadata). */
export const APP_POSITIONING =
  "The operating system for fire protection contractors — from NFPA field inspection to client-ready report and repair quote.";

/** Short label for eyebrow / compact UI. */
export const APP_TAGLINE = "Operating system for fire protection contractors";

export const APP_DESCRIPTION = APP_POSITIONING;

/** Pilot pricing shown on marketing and billing during early access. */
export const PILOT_PRICING = {
  designPartner: {
    label: "Design partner",
    price: "$0–$49",
    period: "/mo",
    detail: "For 2–3 early contractors helping shape the product.",
  },
  founder: {
    label: "Founder rate",
    price: "$99",
    period: "/mo",
    detail: "Locked for 12 months with feedback and permission for a case study.",
  },
} as const;

export const PILOT_SUPPORT_EMAIL = "support@getflareflow.com";

/** Default demo tenant name in seed scripts. */
export const DEMO_COMPANY_NAME = "GetFlareflow Demo Co.";

/** Production shared demo workspace (legacy name in DB). */
export const SHARED_DEMO_COMPANY_ID = "cmpc93rk30000tkngtmv98mra";
export const SHARED_DEMO_COMPANY_NAME = "GetFlareflow";
