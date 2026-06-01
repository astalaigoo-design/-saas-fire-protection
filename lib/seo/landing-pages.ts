export type SeoLandingSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SeoLandingPageConfig = {
  path: string;
  title: string;
  description: string;
  headline: string;
  subhead: string;
  sections: SeoLandingSection[];
  relatedLinks: { href: string; label: string }[];
};

export const NFPA_25_INSPECTION_SOFTWARE: SeoLandingPageConfig = {
  path: "/nfpa-25-inspection-software",
  title: "NFPA 25 inspection software",
  description:
    "NFPA 25 inspection software for fire sprinkler contractors — mobile checklists with standard citations, compliance PDFs, deficiency tracking, and repair quotes.",
  headline: "NFPA 25 inspection software for sprinkler contractors",
  subhead:
    "Run wet, dry, and preaction sprinkler inspections with citation-backed NFPA 25 checklists, photos, and client-ready reports — without spreadsheets or generic field apps.",
  sections: [
    {
      title: "Built for NFPA 25 workflows",
      paragraphs: [
        "GetFlareflow ships inspection types aligned to sprinkler system maintenance and testing. Each checklist item references the NFPA standard, edition, and section so technicians and AHJs see defensible documentation.",
        "Schedule monthly, quarterly, or annual visits, assign technicians, and track open jobs from one command center.",
      ],
      bullets: [
        "Sprinkler, wet/dry, and NFPA 25 pack checklists",
        "Bulk N/A for sections that do not apply on site",
        "Auto follow-up when deficiencies are recorded",
        "Due-date reminders before inspections are due",
      ],
    },
    {
      title: "From riser to report in one app",
      paragraphs: [
        "Technicians complete pass / fail / N/A on mobile — including offline. Sign on glass, attach photos to failed items, and submit to generate a branded compliance PDF.",
        "When repairs are quoted, failed items flow into draft repair quotes you can email with the report.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/fire-sprinkler-inspection-app", label: "Fire sprinkler inspection app" },
    { href: "/", label: "GetFlareflow home" },
  ],
};

export const FIRE_SPRINKLER_INSPECTION_APP: SeoLandingPageConfig = {
  path: "/fire-sprinkler-inspection-app",
  title: "Fire sprinkler inspection app",
  description:
    "Fire sprinkler inspection app for contractors — offline mobile checklists, NFPA citations, compliance reports, and repair quotes from one field workflow.",
  headline: "Fire sprinkler inspection app for the field",
  subhead:
    "A mobile-first inspection app for fire protection contractors — not generic CMMS software. Checklists, photos, signatures, and PDF reports built for sprinkler and life-safety work.",
  sections: [
    {
      title: "Mobile inspections that work on site",
      paragraphs: [
        "My Jobs gives technicians a simple queue. Open an inspection, walk the checklist, and finish with a signature — even when the building has poor signal.",
        "Work saved offline syncs when connectivity returns.",
      ],
      bullets: [
        "Large pass / fail / N/A controls for gloved hands",
        "Resume in-progress jobs from the home screen",
        "Pre-job brief with site contact and prior deficiencies",
        "PWA install for a home-screen field app",
      ],
    },
    {
      title: "Sprinkler compliance your clients understand",
      paragraphs: [
        "Share read-only report links with your logo and report phone. Send repair quotes customers can accept online.",
        "Owners schedule repair or re-inspection visits in one click after a quote is accepted.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/nfpa-25-inspection-software", label: "NFPA 25 inspection software" },
    { href: "/", label: "GetFlareflow home" },
  ],
};

export const SEO_LANDING_PAGES = [
  NFPA_25_INSPECTION_SOFTWARE,
  FIRE_SPRINKLER_INSPECTION_APP,
] as const;
