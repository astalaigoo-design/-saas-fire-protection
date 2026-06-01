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

const NFPA_WET_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Wet system riser gauges read normal",
    description:
      "NFPA 25 (2023) §5.2.4 — Gauges on wet pipe systems shall be inspected to verify normal water pressure at each riser.",
  },
  {
    label: "Alarm valves and waterflow devices functional",
    description:
      "NFPA 25 (2023) §5.4.2 — Waterflow alarm and alarm valve switches shall be inspected and tested per Table 5.1.1.",
  },
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "NFPA 25 (2023) §5.2.1 — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "NFPA 25 (2023) §5.2.6 — Control valves shall be accessible, identified, and in the correct position.",
  },
  {
    label: "Main drain test performed and water supply adequate",
    description:
      "NFPA 25 (2023) §5.3.2 — Main drain test at the system riser to verify water supply adequacy.",
  },
  {
    label: "Fire department connection accessible and undamaged",
    description:
      "NFPA 25 (2023) §5.2.5 — Fire department connections inspected for caps, swivels, and check valve operation.",
  },
];

const NFPA_DRY_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Dry pipe and preaction gauges read normal",
    description:
      "NFPA 25 (2023) §5.2.4 — Gauges on dry pipe and preaction systems shall be inspected monthly for normal air and water pressure.",
  },
  {
    label: "Dry pipe valve and quick-opening device accessible",
    description:
      "NFPA 25 (2023) §5.2.2 — Dry pipe valve interior and quick-opening device inspected per the required frequency.",
  },
  {
    label: "Low point drains and auxiliary drains clear",
    description:
      "NFPA 25 (2023) §5.2.3 — Auxiliary drains shall be operated to remove water that could freeze and break fittings.",
  },
  {
    label: "Trip test and low-air supervisory signals verified",
    description:
      "NFPA 25 (2023) §5.3.1 — Full-flow trip tests and low-air supervisory signals verified per Table 5.1.1.",
  },
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "NFPA 25 (2023) §5.2.1 — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "NFPA 25 (2023) §5.2.6 — Control valves shall be accessible, identified, and in the correct position.",
  },
];

const NFPA_SPRINKLER_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "NFPA 25 (2023) §5.2.1 — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage; maintain minimum clearance below deflectors per §5.2.1.1.1.",
  },
  {
    label: "Sprinkler system gauges read normal",
    description:
      "NFPA 25 (2023) §5.2.4 — Gauges on wet, dry pipe, and preaction systems shall be inspected to verify normal water and air pressure.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "NFPA 25 (2023) §5.2.6 — Control valves shall be accessible, properly identified, sealed or locked, and in the correct position.",
  },
  {
    label: "Waterflow and supervisory signal devices functional",
    description:
      "NFPA 25 (2023) §5.4.2 — Waterflow alarm and supervisory signal initiating devices shall be inspected and tested per Table 5.1.1.",
  },
  {
    label: "Main drain test performed and water supply adequate",
    description:
      "NFPA 25 (2023) §5.3.2 — Main drain test at the system riser to verify water supply adequacy and compare to prior results.",
  },
  {
    label: "Fire department connection accessible and undamaged",
    description:
      "NFPA 25 (2023) §5.2.5 — Fire department connections shall be inspected for caps, swivels, check valve operation, and accessibility.",
  },
  {
    label: "Fire pump and controller indicators normal",
    description:
      "NFPA 25 (2023) §5.3.3 — Fire pump weekly/monthly/annual inspections per Table 5.1.1; controller power, pressure, and run indicators verified.",
  },
];

const NFPA_ALARM_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Fire alarm control unit shows normal status",
    description:
      "NFPA 72 (2022) §14.3.1 — Control unit trouble, supervisory, and alarm indicators shall show normal condition per Table 14.3.1.",
  },
  {
    label: "Initiating devices inspected and free of obstruction",
    description:
      "NFPA 72 (2022) §14.4.4 — Smoke, heat, and manual initiating devices inspected for accessibility, damage, and proper location.",
  },
  {
    label: "Notification appliances operational",
    description:
      "NFPA 72 (2022) §14.4.4 — Horns, strobes, and speakers inspected and functionally tested per the approved sequence.",
  },
  {
    label: "Primary and secondary power supplies verified",
    description:
      "NFPA 72 (2022) §14.3.1 — AC power, batteries, and chargers inspected; battery date and voltage within manufacturer limits.",
  },
  {
    label: "Supervisory and trouble signals tested",
    description:
      "NFPA 72 (2022) §14.3.1 — Supervisory conditions (valve tamper, low air, etc.) generate the correct supervisory signal at the FACP.",
  },
  {
    label: "Annual sensitivity and function testing elements completed",
    description:
      "NFPA 72 (2022) §14.4.5 — Annual inspection and testing of initiating devices, notification appliances, and interfaced systems per Table 14.3.1.",
  },
];

const NFPA_HOOD_CHECKLIST: NfpaChecklistItem[] = [
  {
    label: "Commercial cooking exhaust hood and ducts accessible for cleaning",
    description:
      "NFPA 96 (2021) §11.4 — Hood, grease removal devices, fans, and ducts inspected for grease accumulation and access panels in place.",
  },
  {
    label: "Fixed fire-extinguishing system cylinders and agent in service",
    description:
      "NFPA 96 (2021) §11.6 — Extinguishing agent quantity, cylinder pressure, and tamper indicators verified for the cooking suppression system.",
  },
  {
    label: "Fusible links and detection line intact and within replacement date",
    description:
      "NFPA 96 (2021) §11.6 — Fusible links or other detection means shall be replaced at intervals not exceeding manufacturer requirements.",
  },
  {
    label: "Nozzles and distribution piping unobstructed and correctly aimed",
    description:
      "NFPA 96 (2021) §11.6 — Nozzles shall be free of grease buildup, caps in place where required, and aimed at the hazard per the system design.",
  },
  {
    label: "Manual pull station and automatic actuation tested",
    description:
      "NFPA 96 (2021) §11.6 — Manual actuation device accessible and functional; automatic release interlocked with fuel and power shutoffs where required.",
  },
  {
    label: "Fuel and power interlock shutdown operates with system discharge",
    description:
      "NFPA 96 (2021) §10.2.3 — Upon system operation, fuel and electrical power to cooking equipment shall shut down per the listed system design.",
  },
];

const CHECKLIST_BY_CODE: Record<string, readonly NfpaChecklistItem[]> = {
  monthly: NFPA_MONTHLY_CHECKLIST,
  quarterly: NFPA_QUARTERLY_CHECKLIST,
  annual: NFPA_ANNUAL_CHECKLIST,
  wet: NFPA_WET_CHECKLIST,
  dry: NFPA_DRY_CHECKLIST,
  sprinkler: NFPA_SPRINKLER_CHECKLIST,
  alarm: NFPA_ALARM_CHECKLIST,
  hood: NFPA_HOOD_CHECKLIST,
  kitchen: NFPA_HOOD_CHECKLIST,
};

/** Checklist items keyed to inspection type code (cadence or NFPA pack). */
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
