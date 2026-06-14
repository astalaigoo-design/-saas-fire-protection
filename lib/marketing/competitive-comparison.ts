import { PILOT_PRICING } from "@/lib/branding";

export const COMPARE_PATH = "/compare" as const;

export type ComparisonRating = "strong" | "yes" | "partial" | "varies" | "no";

export type ComparisonRow = {
  feature: string;
  flareflow: { rating: ComparisonRating; note: string };
  fireSpecialists: { rating: ComparisonRating; note: string };
  enterprise: { rating: ComparisonRating; note: string };
};

/** Grouped for fair comparison — individual products differ; verify with each vendor. */
export const COMPARISON_COLUMNS = {
  flareflow: "GetFlareflow",
  fireSpecialists: "Fire-specialist tools (e.g. QuoteIQ, Deelo, Uptick)",
  enterprise: "Enterprise FSM (e.g. ServiceTitan, BuildOps)",
} as const;

export const COMPETITIVE_STRENGTHS = [
  {
    title: "Mobile UX built for pump rooms",
    description:
      "Large pass/fail controls, offline inspection sync, and a single-column field flow — designed for gloves, ladders, and bad signal in basements.",
  },
  {
    title: "Inspection → quote without re-keying",
    description:
      "Failed checklist items become draft repair quotes. Customers accept online; follow-up jobs schedule from the same system — not a separate quoting tool.",
  },
  {
    title: "Straightforward pricing",
    description: `One flat ${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} for your whole company — admins, technicians, and branches. No per-seat sales call or six-figure implementation project.`,
  },
] as const;

export const AHJ_INTEGRATION_TRANSPARENCY = {
  headline: "AHJ portal filing — transparent today",
  body:
    "Some fire-specialist platforms advertise native filing to AHJ reporting portals such as The Compliance Engine or Brycer. GetFlareflow delivers NFPA-formatted compliance PDFs and shareable report links your customers and AHJs expect — your team uploads to local portals when required.",
  roadmap:
    "Direct portal integrations are on our roadmap. Design partners help us prioritize which jurisdictions and portals matter most in your market.",
} as const;

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "NFPA-native checklists with code citations",
    flareflow: { rating: "strong", note: "Built in — every item cites standard, edition, and section." },
    fireSpecialists: { rating: "yes", note: "Common among fire-focused vendors; depth varies." },
    enterprise: { rating: "partial", note: "Often generic checklists or add-on modules." },
  },
  {
    feature: "Mobile field inspection (offline-capable)",
    flareflow: { rating: "strong", note: "Phone-first inspect flow with offline sync." },
    fireSpecialists: { rating: "yes", note: "Most offer mobile apps; UX and offline depth vary." },
    enterprise: { rating: "yes", note: "Mobile apps available; often optimized for broader trades." },
  },
  {
    feature: "Client-ready compliance PDFs",
    flareflow: { rating: "yes", note: "Branded PDFs + shareable report links on submit." },
    fireSpecialists: { rating: "yes", note: "Standard offering in this category." },
    enterprise: { rating: "partial", note: "Reporting often requires configuration or third-party tools." },
  },
  {
    feature: "Direct AHJ portal filing (Compliance Engine, Brycer, etc.)",
    flareflow: {
      rating: "no",
      note: "PDF export today; upload to your local portal. Integrations planned with partner input.",
    },
    fireSpecialists: {
      rating: "varies",
      note: "Some vendors advertise native portal connections — confirm for your AHJs.",
    },
    enterprise: { rating: "partial", note: "Integrations possible via marketplace or custom projects." },
  },
  {
    feature: "Repair quotes from failed inspection items",
    flareflow: { rating: "strong", note: "Draft quotes from deficiencies in one workflow." },
    fireSpecialists: { rating: "varies", note: "Quoting depth varies; some focus on inspection only." },
    enterprise: { rating: "partial", note: "Quoting often separate module or partner integration." },
  },
  {
    feature: "Customer quote accept + follow-up scheduling",
    flareflow: { rating: "yes", note: "Online accept link and schedule follow-up from accepted quotes." },
    fireSpecialists: { rating: "varies", note: "Varies by product; verify quoting workflow end-to-end." },
    enterprise: { rating: "yes", note: "Available in full platform suites at higher cost." },
  },
  {
    feature: "Flat, published pricing",
    flareflow: {
      rating: "strong",
      note: `${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} whole company, published on site.`,
    },
    fireSpecialists: { rating: "varies", note: "Often quote-based or tiered; request pricing." },
    enterprise: {
      rating: "no",
      note: "Custom contracts, per-seat fees, and implementation costs typical.",
    },
  },
  {
    feature: "Built specifically for fire protection contractors",
    flareflow: { rating: "strong", note: "Vertical product — not adapted from generic field service." },
    fireSpecialists: { rating: "strong", note: "Category focus; feature mix differs by vendor." },
    enterprise: { rating: "partial", note: "Multi-trade platforms serving many contractor types." },
  },
];

export const COMPARE_FAQS = [
  {
    question: "Does GetFlareflow file directly to The Compliance Engine or Brycer?",
    answer:
      "Not yet. You generate NFPA-formatted compliance PDFs and shareable report links in GetFlareflow, then upload to your AHJ portal when your jurisdiction requires it — the same deliverable building owners expect. We are building direct portal integrations with input from design partners on which portals to prioritize.",
  },
  {
    question: "How is GetFlareflow different from QuoteIQ, Deelo, or Uptick?",
    answer:
      "Those tools are built for fire and life safety contractors and may offer features we do not — including AHJ portal connections in some cases. GetFlareflow differentiates on phone-first field UX, inspection-to-quote automation without re-keying, NFPA citations on every checklist item, and flat published pricing instead of a sales-led quote.",
  },
  {
    question: "Why not ServiceTitan or BuildOps?",
    answer:
      "Enterprise FSM platforms excel at scale across many trades but typically require custom implementation, per-seat pricing, and ongoing admin overhead. GetFlareflow is for fire protection contractors who want NFPA-native workflows and predictable monthly cost — not a six-figure platform rollout.",
  },
  {
    question: "Can I try GetFlareflow before committing?",
    answer:
      "Yes — start a free trial with no credit card. Run a real inspection, generate a compliance PDF, and test the quote workflow on your next job before you subscribe.",
  },
] as const;

export const RATING_LABELS: Record<ComparisonRating, string> = {
  strong: "Standout",
  yes: "Yes",
  partial: "Partial",
  varies: "Varies",
  no: "Not today",
};
