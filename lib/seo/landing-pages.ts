export type SeoLandingSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SeoLandingFaq = {
  question: string;
  answer: string;
};

export type SeoLandingPageConfig = {
  path: string;
  title: string;
  description: string;
  headline: string;
  subhead: string;
  sections: SeoLandingSection[];
  faqs?: SeoLandingFaq[];
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
      bullets: [
        "NFPA 25 form layout with your logo and report phone",
        "Share read-only report links (/r/…) for property managers",
        "Certificate numbers allocated per your jurisdiction settings",
        "Equipment register tracks assets due for service by building",
      ],
    },
    {
      title: "Who this is for",
      paragraphs: [
        "Fire protection contractors running NFPA 25 sprinkler and water-based system work — not generic facilities maintenance teams. If your techs need citations on every line item and your office needs one place for schedules, deficiencies, and customer reports, this page describes your workflow.",
        "Owners and admins see company-wide or branch-filtered dashboards. Technicians only see jobs assigned to them.",
      ],
    },
  ],
  faqs: [
    {
      question: "Does GetFlareflow include NFPA 25 checklist citations?",
      answer:
        "Yes. Sprinkler inspection items ship with NFPA standard, edition, and section references (for example NFPA 25 §5.2.1). Technicians see them in the field; reports include the same citations for AHJ review.",
    },
    {
      question: "Can technicians complete NFPA 25 inspections offline?",
      answer:
        "Yes. Field inspections save locally when signal is poor and sync when connectivity returns. Install the PWA on a phone home screen for a dedicated field app experience.",
    },
    {
      question: "What happens when a sprinkler inspection fails?",
      answer:
        "Failed items can auto-create a draft repair quote. Your office reviews line items, emails the compliance PDF and quote together, and schedules follow-up work when the customer accepts online.",
    },
  ],
  relatedLinks: [
    { href: "/fire-sprinkler-inspection-app", label: "NFPA 25 sprinkler inspection app" },
    { href: "/fire-protection-repair-quoting-software", label: "Fire protection repair quoting" },
    { href: "/fire-alarm-compliance-reporting-software", label: "Fire alarm compliance reporting" },
    { href: "/pricing", label: "Pricing" },
    { href: "/", label: "GetFlareflow home" },
  ],
};

export const FIRE_SPRINKLER_INSPECTION_APP: SeoLandingPageConfig = {
  path: "/fire-sprinkler-inspection-app",
  title: "NFPA 25 sprinkler inspection app",
  description:
    "NFPA 25 sprinkler inspection app for fire protection contractors — offline mobile checklists, standard citations, compliance PDFs, and repair quotes from one field workflow.",
  headline: "NFPA 25 sprinkler inspection app for the field",
  subhead:
    "A mobile-first inspection app for fire protection contractors — not generic CMMS software. Sprinkler checklists, photos, signatures, and PDF reports built for NFPA 25 and life-safety work.",
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
      bullets: [
        "Photos attached to failed sprinkler items",
        "Section bulk N/A when wet systems are not present",
        "Recurring jobs auto-schedule after submit",
        "Command center shows overdue buildings and open deficiencies",
      ],
    },
    {
      title: "Sprinkler inspection app vs. generic field service tools",
      paragraphs: [
        "Generic apps treat inspections as generic tasks. GetFlareflow groups checklist items by NFPA section (sprinkler and water-based, fire alarm, extinguishers, and more) and generates reports formatted for fire protection documentation.",
        "One flat monthly price covers your whole company — admins, technicians, and branches — with no per-seat fees.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is this a dedicated fire sprinkler inspection app?",
      answer:
        "Yes. The field workflow is built for fire protection contractors: NFPA citations, compliance PDFs, deficiency tracking, and repair quotes — not generic work orders or CMMS checklists.",
    },
    {
      question: "Does the app support wet, dry, and preaction systems?",
      answer:
        "Inspection type packs include NFPA 25 sprinkler workflows. Use bulk N/A on sections that do not apply at a given building so techs only see relevant items.",
    },
    {
      question: "How do customers receive sprinkler inspection reports?",
      answer:
        "After submit, staff can email a branded PDF. You can also share a read-only link. When repairs are needed, the report and repair quote can go in one email.",
    },
  ],
  relatedLinks: [
    { href: "/nfpa-25-inspection-software", label: "NFPA 25 inspection software" },
    { href: "/fire-protection-repair-quoting-software", label: "Fire protection repair quoting" },
    { href: "/fire-alarm-compliance-reporting-software", label: "Fire alarm compliance reporting" },
    { href: "/pricing", label: "Pricing" },
    { href: "/", label: "GetFlareflow home" },
  ],
};

export const FIRE_ALARM_COMPLIANCE_REPORTING: SeoLandingPageConfig = {
  path: "/fire-alarm-compliance-reporting-software",
  title: "Fire alarm compliance reporting software",
  description:
    "Fire alarm compliance reporting software for NFPA 72 contractors — citation-backed checklists, branded inspection PDFs, certificate numbers, and customer report links.",
  headline: "Fire alarm compliance reporting software",
  subhead:
    "Document NFPA 72 fire alarm inspections with standard citations, photos, signatures, and AHJ-ready PDF reports — from FACP walk-through to emailed compliance package.",
  sections: [
    {
      title: "NFPA 72 checklists with citations",
      paragraphs: [
        "Fire alarm inspection packs include initiating devices, notification appliances, control unit indicators, and battery checks — each line tied to NFPA 72 edition and section references your team and AHJs expect.",
        "Checklist sections group fire alarm items separately from sprinkler, extinguisher, and hood work on combined visits.",
      ],
      bullets: [
        "Monthly, quarterly, and annual NFPA 72 cadences",
        "Fire alarm section in multi-system inspections",
        "Pass / fail / N/A with deficiency notes and photos",
        "Pre-job brief shows prior open deficiencies at the site",
      ],
    },
    {
      title: "Compliance reports clients and AHJs can use",
      paragraphs: [
        "Submit an inspection to generate a branded compliance PDF with your company logo and report phone. NFPA 72 form layouts present results in a familiar fire alarm report structure.",
        "Allocate certificate or report numbers per jurisdiction settings. Share read-only links so property managers download the latest report without calling your office.",
      ],
      bullets: [
        "NFPA 72 fire alarm report template (Flareflow-native PDF)",
        "Email report on submit or bundle with a repair quote",
        "Public read-only report links (/r/…)",
        "Reports sent log for office follow-up",
      ],
    },
    {
      title: "Close the loop after the alarm inspection",
      paragraphs: [
        "Failed devices do not disappear in a PDF attachment. Deficiencies track in the command center until resolved and verified on re-inspection.",
        "When repairs are quoted, draft line items pull from failed checklist items so your quote matches what the technician documented in the field.",
      ],
    },
  ],
  faqs: [
    {
      question: "Does GetFlareflow support NFPA 72 fire alarm inspections?",
      answer:
        "Yes. Enable the fire alarm inspection pack for NFPA 72 workflows — FACP, initiating devices, notification appliances, and related Table 14.3.1 items with citations.",
    },
    {
      question: "Can we email fire alarm compliance reports automatically?",
      answer:
        "Reports can email on submit when configured, or staff can send manually from Reports. Combine the compliance PDF with a repair quote in one customer email when deficiencies need pricing.",
    },
    {
      question: "Is fire alarm reporting separate from sprinkler work?",
      answer:
        "You can run dedicated fire alarm inspections or combined visits. Checklist sections separate fire alarm, sprinkler, extinguisher, and hood items so reports stay organized.",
    },
  ],
  relatedLinks: [
    { href: "/nfpa-25-inspection-software", label: "NFPA 25 inspection software" },
    { href: "/fire-sprinkler-inspection-app", label: "NFPA 25 sprinkler inspection app" },
    { href: "/fire-protection-repair-quoting-software", label: "Fire protection repair quoting" },
    { href: "/pricing", label: "Pricing" },
    { href: "/", label: "GetFlareflow home" },
  ],
};

export const FIRE_PROTECTION_REPAIR_QUOTING: SeoLandingPageConfig = {
  path: "/fire-protection-repair-quoting-software",
  title: "Fire protection repair quoting software",
  description:
    "Fire protection repair quoting software — draft quotes from failed inspection items, email report + quote together, customer accept online, schedule follow-up, and invoice accepted work.",
  headline: "Fire protection repair quoting software",
  subhead:
    "Turn failed sprinkler, alarm, and life-safety inspection items into professional repair quotes — without retyping deficiencies into a separate estimating tool.",
  sections: [
    {
      title: "Quotes start in the inspection, not a blank spreadsheet",
      paragraphs: [
        "When a technician marks items failed, GetFlareflow can create a draft repair quote tied to that inspection. Line items reference the same deficiency notes and photos captured in the field.",
        "Office staff review totals, adjust pricing, preview the quote PDF, and send — often bundled with the compliance report in one email.",
      ],
      bullets: [
        "Auto draft quote from failed checklist items",
        "Quote PDF preview before sending",
        "Report + quote in one customer email",
        "Quotes pipeline in Command center and Reports",
      ],
    },
    {
      title: "Customer accept, decline, or request changes online",
      paragraphs: [
        "Customers open a secure link (/q/…) to review the repair quote without a login. They can accept, decline, or request changes — you get notified by email.",
        "Acceptance records approval only; it does not charge a card. Your team sends a repair invoice separately when work is billed.",
      ],
      bullets: [
        "Public quote response links — no customer account required",
        "Accept schedules a follow-up job in one click",
        "Decline and change-request notifications to your team",
        "Quote status tracked from draft through accepted",
      ],
    },
    {
      title: "Repair invoices after the quote is accepted",
      paragraphs: [
        "Generate a repair invoice PDF from an accepted quote with sequential invoice numbers. Track sent and paid status in Flareflow.",
        "Repair quoting is your customer billing workflow — separate from your GetFlareflow subscription (Paddle). Integrations can sync quote status to your CMMS via webhooks or the REST API.",
      ],
      bullets: [
        "Repair invoices page for accepted quotes",
        "PDF preview and email to the customer",
        "Webhook and API sync for external systems",
        "Not a replacement for QuickBooks — operational quotes and invoices only",
      ],
    },
  ],
  faqs: [
    {
      question: "Does GetFlareflow replace QuickBooks or Stripe for repair billing?",
      answer:
        "No. Repair quotes and invoices track customer repair work inside Flareflow. Accounting sync and card payments stay in your existing stack — we focus on the inspection-to-quote pipeline.",
    },
    {
      question: "Can repair quotes include only some failed items?",
      answer:
        "Yes. Review and edit the draft before sending. Add or remove line items, adjust quantities, and set tax percentage on the quote.",
    },
    {
      question: "What happens after a customer accepts a repair quote?",
      answer:
        "Your team can schedule a follow-up inspection or repair visit from the quote. Create a repair invoice when billing is ready — acceptance does not charge the customer automatically.",
    },
  ],
  relatedLinks: [
    { href: "/nfpa-25-inspection-software", label: "NFPA 25 inspection software" },
    { href: "/fire-sprinkler-inspection-app", label: "NFPA 25 sprinkler inspection app" },
    { href: "/fire-alarm-compliance-reporting-software", label: "Fire alarm compliance reporting" },
    { href: "/pricing", label: "Pricing" },
    { href: "/", label: "GetFlareflow home" },
  ],
};

export const SEO_LANDING_PAGES = [
  NFPA_25_INSPECTION_SOFTWARE,
  FIRE_SPRINKLER_INSPECTION_APP,
  FIRE_ALARM_COMPLIANCE_REPORTING,
  FIRE_PROTECTION_REPAIR_QUOTING,
] as const;

export const SEO_LANDING_PATHS = SEO_LANDING_PAGES.map((page) => page.path);
