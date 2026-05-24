export type NfpaChecklistItem = {
  label: string;
  /** Exact NFPA standard, edition, and section citation for the ticket. */
  description: string;
};

const NFPA_MONTHLY_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Portable fire extinguishers accessible and in designated location",
    description:
      "NFPA 10 (2022) §7.2.2.1.1 — Monthly inspection confirms each extinguisher is in its designated place, unobstructed, not tampered with, and the pressure gauge (if equipped) reads in the operable range.",
  },
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "NFPA 25 (2023) §5.2.1 — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage; maintain minimum clearance below deflectors per §5.2.1.1.1.",
  },
  {
    label: "Dry pipe and preaction system gauges read normal",
    description:
      "NFPA 25 (2023) §5.2.4 — Gauges on dry pipe and preaction systems shall be inspected monthly to verify normal air and water pressure.",
  },
  {
    label: "Fire alarm control unit shows normal status",
    description:
      "NFPA 72 (2022) §14.3.1 — Fire alarm systems shall be inspected per Table 14.3.1; control unit trouble, supervisory, and alarm indicators shall show normal condition.",
  },
  {
    label: "Means of egress illumination and exit signs operational",
    description:
      "NFPA 101 (2021) §7.9.2 — Emergency lighting and §7.10.1 exit sign visibility shall be verified during monthly means-of-egress inspections.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "NFPA 25 (2023) §5.2.6 — Control valves shall be inspected monthly to verify they are in the correct position, sealed, locked, or supervised as required.",
  },
];

const NFPA_QUARTERLY_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Waterflow alarm and supervisory signal devices tested",
    description:
      "NFPA 25 (2023) Table 5.1.1 — Quarterly inspection and test of waterflow alarm and supervisory signal initiating devices per §5.4.2.",
  },
  {
    label: "Control valves exercised and returned to normal position",
    description:
      "NFPA 25 (2023) §5.2.6 — Quarterly inspection confirms control valves are accessible, properly identified, and in the correct open or supervised position.",
  },
  {
    label: "Dry pipe and preaction gauges compared to master gauge",
    description:
      "NFPA 25 (2023) §5.3.1 — Gauges on dry pipe and preaction systems shall be compared to a master gauge quarterly.",
  },
  {
    label: "Fire alarm quarterly inspection elements completed",
    description:
      "NFPA 72 (2022) Table 14.3.1 — Quarterly inspection of fire alarm initiating devices, notification appliances, and control equipment per §14.4.4.",
  },
  {
    label: "Portable fire extinguishers due for annual maintenance identified",
    description:
      "NFPA 10 (2022) §7.3.1 — Maintenance procedures shall be performed at intervals not exceeding 1 year; verify service tags and due dates during quarterly review.",
  },
  {
    label: "Commercial kitchen hood suppression system visually inspected",
    description:
      "NFPA 96 (2021) §11.6 — Fixed fire-extinguishing systems protecting commercial cooking equipment shall be inspected at least every 6 months; verify fusible links, nozzles, and agent cylinder condition.",
  },
];

const NFPA_ANNUAL_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Sprinkler system annual inspection and main drain test",
    description:
      "NFPA 25 (2023) Table 5.1.1 — Annual inspection of sprinkler system components and main drain test per §5.3.2 to verify water supply adequacy.",
  },
  {
    label: "Internal dry pipe and deluge valve inspection performed",
    description:
      "NFPA 25 (2023) §5.2.2 — Internal inspection of dry pipe and deluge valves shall be performed annually unless conditions require a different frequency.",
  },
  {
    label: "Fire pump annual flow test and controller inspection",
    description:
      "NFPA 25 (2023) §5.3.3 — Fire pumps shall receive an annual flow test; controller indicators and power supply verified per Chapter 5.",
  },
  {
    label: "Fire alarm system annual inspection and sensitivity testing",
    description:
      "NFPA 72 (2022) §14.4.5 — Fire alarm systems shall be inspected and tested annually per Table 14.3.1, including initiating devices and notification appliances.",
  },
  {
    label: "Portable fire extinguisher annual maintenance performed",
    description:
      "NFPA 10 (2022) §7.3.1 — Maintenance shall be performed at intervals not exceeding 1 year; verify service collar, tag, and internal examination where required.",
  },
  {
    label: "Emergency lighting 90-minute battery duration test",
    description:
      "NFPA 101 (2021) §7.9.2 — Emergency lighting systems shall be tested annually for not less than 90 minutes unless the system is monitored.",
  },
  {
    label: "Standpipe and hose connection annual inspection",
    description:
      "NFPA 25 (2023) §5.3.4 — Standpipe systems shall be inspected annually, including hose connections, cabinets, and hose where provided.",
  },
  {
    label: "Fire department connection and hydrant supply verified",
    description:
      "NFPA 25 (2023) §5.2.5 — Fire department connections shall be inspected annually for accessibility, caps, swivels, and check valve operation.",
  },
];

const CHECKLIST_BY_CODE: Record<string, readonly NfpaChecklistItem[]> = {
  monthly: NFPA_MONTHLY_CHECKLIST,
  quarterly: NFPA_QUARTERLY_CHECKLIST,
  annual: NFPA_ANNUAL_CHECKLIST,
};

/** Checklist items keyed to inspection type code (`annual`, `quarterly`, `monthly`). */
export function getNfpaChecklistForInspectionTypeCode(
  code: string,
): readonly NfpaChecklistItem[] {
  const normalized = code.trim().toLowerCase();
  return CHECKLIST_BY_CODE[normalized] ?? NFPA_ANNUAL_CHECKLIST;
}

/** Labels only — kept for legacy seed/scripts that expect string arrays. */
export const DEFAULT_INSPECTION_CHECKLIST = NFPA_ANNUAL_CHECKLIST.map(
  (item) => item.label,
) as readonly string[];
