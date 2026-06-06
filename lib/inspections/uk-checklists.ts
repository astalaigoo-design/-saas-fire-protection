import type { ChecklistTemplateItem } from "@/lib/inspections/checklist-item";

const UK_MONTHLY_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Portable fire extinguishers accessible and in designated location",
    description:
      "BS 5306-3:2017 — Monthly visual inspection confirms each extinguisher is in its designated place, unobstructed, and the pressure indicator (if fitted) is in the operable range.",
  },
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "BS EN 12845 / LPC Sprinkler Rules — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage; maintain clearance below deflectors.",
  },
  {
    label: "Dry pipe and preaction system gauges read normal",
    description:
      "BS EN 12845 — Gauges on dry pipe and preaction systems shall be inspected monthly to verify normal air and water pressure.",
  },
  {
    label: "Fire alarm control panel shows normal status",
    description:
      "BS 5839-1:2017 — Fire detection and alarm systems shall be inspected per the routine schedule; control unit trouble, supervisory, and alarm indicators shall show normal condition.",
  },
  {
    label: "Emergency lighting and exit signs operational",
    description:
      "BS 5266-1:2016 — Emergency escape lighting and exit sign visibility shall be verified during monthly checks of means of escape.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "BS EN 12845 — Control valves shall be inspected monthly to verify they are in the correct position, sealed, locked, or supervised as required.",
  },
];

const UK_QUARTERLY_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Waterflow alarm and supervisory signal devices tested",
    description:
      "BS EN 12845 — Quarterly inspection and test of waterflow alarm and supervisory signal initiating devices.",
  },
  {
    label: "Control valves exercised and returned to normal position",
    description:
      "BS EN 12845 — Quarterly inspection confirms control valves are accessible, properly identified, and in the correct open or supervised position.",
  },
  {
    label: "Dry pipe and preaction gauges compared to master gauge",
    description:
      "BS EN 12845 — Gauges on dry pipe and preaction systems shall be compared to a master gauge quarterly.",
  },
  {
    label: "Fire alarm quarterly inspection elements completed",
    description:
      "BS 5839-1:2017 — Quarterly inspection of fire alarm initiating devices, notification appliances, and control equipment.",
  },
  {
    label: "Portable fire extinguishers due for annual service identified",
    description:
      "BS 5306-3:2017 — Basic service shall be performed at intervals not exceeding 1 year; verify service tags and due dates during quarterly review.",
  },
  {
    label: "Commercial kitchen hood suppression system visually inspected",
    description:
      "BS 7937 / LPC kitchen suppression guidance — Fixed fire-extinguishing systems protecting commercial cooking equipment shall be inspected at least every 6 months.",
  },
];

const UK_ANNUAL_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Sprinkler system annual inspection and main drain test",
    description:
      "BS EN 12845 — Annual inspection of sprinkler system components and main drain test to verify water supply adequacy.",
  },
  {
    label: "Internal dry pipe and deluge valve inspection performed",
    description:
      "BS EN 12845 — Internal inspection of dry pipe and deluge valves shall be performed annually unless conditions require a different frequency.",
  },
  {
    label: "Fire pump annual flow test and controller indicators verified",
    description:
      "BS EN 12845 — Fire pumps shall receive an annual flow test; controller indicators and power supply verified.",
  },
  {
    label: "Fire alarm annual inspection and test completed",
    description:
      "BS 5839-1:2017 — Fire alarm systems shall be inspected and tested annually, including initiating devices and notification appliances.",
  },
  {
    label: "Portable fire extinguisher annual service performed",
    description:
      "BS 5306-3:2017 — Basic service shall be performed at intervals not exceeding 1 year; verify service collar, tag, and internal examination where required.",
  },
  {
    label: "Emergency lighting duration test completed",
    description:
      "BS 5266-1:2016 — Emergency lighting systems shall be tested annually for the required duration unless the system is monitored.",
  },
  {
    label: "Standpipe and hose connection annual inspection",
    description:
      "BS EN 12845 — Standpipe systems shall be inspected annually, including hose connections, cabinets, and hose where provided.",
  },
  {
    label: "Fire brigade inlet and hydrant supply verified",
    description:
      "BS EN 12845 — Fire brigade inlets shall be inspected annually for accessibility, caps, swivels, and check valve operation.",
  },
];

const UK_WET_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Wet system riser gauges read normal",
    description:
      "BS EN 12845 — Gauges on wet pipe systems shall be inspected to verify normal water pressure at each riser.",
  },
  {
    label: "Alarm valves and waterflow devices functional",
    description:
      "BS EN 12845 — Waterflow alarm and alarm valve switches shall be inspected and tested per the approved schedule.",
  },
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "BS EN 12845 — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "BS EN 12845 — Control valves shall be accessible, identified, and in the correct position.",
  },
  {
    label: "Main drain test performed and water supply adequate",
    description:
      "BS EN 12845 — Main drain test at the system riser to verify water supply adequacy.",
  },
  {
    label: "Fire brigade inlet accessible and undamaged",
    description:
      "BS EN 12845 — Fire brigade inlets inspected for caps, swivels, and check valve operation.",
  },
];

const UK_DRY_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Dry pipe and preaction gauges read normal",
    description:
      "BS EN 12845 — Gauges on dry pipe and preaction systems shall be inspected for normal air and water pressure.",
  },
  {
    label: "Dry pipe valve and quick-opening device accessible",
    description:
      "BS EN 12845 — Dry pipe valve interior and quick-opening device inspected per the required frequency.",
  },
  {
    label: "Low point drains and auxiliary drains clear",
    description:
      "BS EN 12845 — Auxiliary drains shall be operated to remove water that could freeze and break fittings.",
  },
  {
    label: "Trip test and low-air supervisory signals verified",
    description:
      "BS EN 12845 — Full-flow trip tests and low-air supervisory signals verified per the approved schedule.",
  },
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "BS EN 12845 — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "BS EN 12845 — Control valves shall be accessible, identified, and in the correct position.",
  },
];

const UK_SPRINKLER_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Sprinkler heads free of obstruction, damage, and loading",
    description:
      "BS EN 12845 — Sprinklers shall be free of corrosion, foreign material, paint, and physical damage; maintain minimum clearance below deflectors.",
  },
  {
    label: "Sprinkler system gauges read normal",
    description:
      "BS EN 12845 — Gauges on wet, dry pipe, and preaction systems shall be inspected to verify normal water and air pressure.",
  },
  {
    label: "Control valves in correct open or supervised position",
    description:
      "BS EN 12845 — Control valves shall be accessible, properly identified, sealed or locked, and in the correct position.",
  },
  {
    label: "Waterflow and supervisory signal devices functional",
    description:
      "BS EN 12845 — Waterflow alarm and supervisory signal initiating devices shall be inspected and tested per the approved schedule.",
  },
  {
    label: "Main drain test performed and water supply adequate",
    description:
      "BS EN 12845 — Main drain test at the system riser to verify water supply adequacy and compare to prior results.",
  },
  {
    label: "Fire brigade inlet accessible and undamaged",
    description:
      "BS EN 12845 — Fire brigade inlets shall be inspected for caps, swivels, check valve operation, and accessibility.",
  },
  {
    label: "Fire pump and controller indicators normal",
    description:
      "BS EN 12845 — Fire pump inspections per the approved schedule; controller power, pressure, and run indicators verified.",
  },
];

const UK_ALARM_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Fire alarm control panel shows normal status",
    description:
      "BS 5839-1:2017 — Control unit trouble, supervisory, and alarm indicators shall show normal condition.",
  },
  {
    label: "Initiating devices inspected and free of obstruction",
    description:
      "BS 5839-1:2017 — Smoke, heat, and manual call points inspected for accessibility, damage, and proper location.",
  },
  {
    label: "Notification appliances operational",
    description:
      "BS 5839-1:2017 — Sounders, beacons, and voice alarm devices inspected and functionally tested per the approved sequence.",
  },
  {
    label: "Primary and secondary power supplies verified",
    description:
      "BS 5839-1:2017 — Mains power, batteries, and chargers inspected; battery date and voltage within manufacturer limits.",
  },
  {
    label: "Supervisory and fault signals tested",
    description:
      "BS 5839-1:2017 — Supervisory conditions (valve tamper, low air, etc.) generate the correct supervisory signal at the panel.",
  },
  {
    label: "Annual sensitivity and function testing elements completed",
    description:
      "BS 5839-1:2017 — Annual inspection and testing of initiating devices, notification appliances, and interfaced systems.",
  },
];

const UK_HOOD_CHECKLIST: ChecklistTemplateItem[] = [
  {
    label: "Commercial cooking exhaust hood and ducts accessible for cleaning",
    description:
      "Regulatory Reform (Fire Safety) Order 2005 / BS 7937 — Hood, grease removal devices, fans, and ducts inspected for grease accumulation and access panels in place.",
  },
  {
    label: "Fixed fire-extinguishing system cylinders and agent in service",
    description:
      "BS 7937 — Extinguishing agent quantity, cylinder pressure, and tamper indicators verified for the cooking suppression system.",
  },
  {
    label: "Fusible links and detection line intact and within replacement date",
    description:
      "BS 7937 — Fusible links or other detection means shall be replaced at intervals not exceeding manufacturer requirements.",
  },
  {
    label: "Nozzles and distribution piping unobstructed and correctly aimed",
    description:
      "BS 7937 — Nozzles shall be free of grease buildup, caps in place where required, and aimed at the hazard per the system design.",
  },
  {
    label: "Manual release and automatic actuation tested",
    description:
      "BS 7937 — Manual actuation device accessible and functional; automatic release interlocked with fuel and power shutoffs where required.",
  },
  {
    label: "Fuel and power interlock shutdown operates with system discharge",
    description:
      "BS 7937 — Upon system operation, fuel and electrical power to cooking equipment shall shut down per the listed system design.",
  },
];

const CHECKLIST_BY_CODE: Record<string, readonly ChecklistTemplateItem[]> = {
  monthly: UK_MONTHLY_CHECKLIST,
  quarterly: UK_QUARTERLY_CHECKLIST,
  annual: UK_ANNUAL_CHECKLIST,
  wet: UK_WET_CHECKLIST,
  dry: UK_DRY_CHECKLIST,
  sprinkler: UK_SPRINKLER_CHECKLIST,
  alarm: UK_ALARM_CHECKLIST,
  hood: UK_HOOD_CHECKLIST,
  kitchen: UK_HOOD_CHECKLIST,
};

/** Checklist items keyed to inspection type code (cadence or UK system pack). */
export function getUkChecklistForInspectionTypeCode(
  code: string,
): readonly ChecklistTemplateItem[] {
  const normalized = code.trim().toLowerCase();
  return CHECKLIST_BY_CODE[normalized] ?? UK_ANNUAL_CHECKLIST;
}
