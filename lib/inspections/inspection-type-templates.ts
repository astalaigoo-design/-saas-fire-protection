/**
 * System inspection type templates. Cadence types ship on new companies;
 * NFPA packs are enabled from Organization settings.
 */
export const INSPECTION_TYPE_TEMPLATE_CODES = [
  "monthly",
  "quarterly",
  "annual",
  "sprinkler",
  "alarm",
  "hood",
] as const;

export type InspectionTypeTemplateCode =
  (typeof INSPECTION_TYPE_TEMPLATE_CODES)[number];

export type InspectionTypeTemplate = {
  code: InspectionTypeTemplateCode;
  name: string;
  description: string;
  /** Cadence vs focused NFPA system pack. */
  category: "cadence" | "nfpa_pack";
  /** Created automatically when a company is provisioned. */
  defaultEnabled: boolean;
};

export const INSPECTION_TYPE_TEMPLATES: readonly InspectionTypeTemplate[] = [
  {
    code: "monthly",
    name: "Monthly Inspection",
    description: "Broad monthly life-safety walkthrough across systems.",
    category: "cadence",
    defaultEnabled: true,
  },
  {
    code: "quarterly",
    name: "Quarterly Inspection",
    description: "Quarterly tests and valve exercises per NFPA schedules.",
    category: "cadence",
    defaultEnabled: true,
  },
  {
    code: "annual",
    name: "Annual Inspection",
    description: "Full annual compliance visit with main drain and annual tests.",
    category: "cadence",
    defaultEnabled: true,
  },
  {
    code: "sprinkler",
    name: "Sprinkler system",
    description: "NFPA 25 sprinkler inspection pack — heads, valves, gauges, and water supply.",
    category: "nfpa_pack",
    defaultEnabled: false,
  },
  {
    code: "alarm",
    name: "Fire alarm",
    description: "NFPA 72 fire alarm inspection pack — FACP, devices, and notification.",
    category: "nfpa_pack",
    defaultEnabled: false,
  },
  {
    code: "hood",
    name: "Kitchen hood suppression",
    description: "NFPA 96 commercial cooking hood and fixed extinguishing system pack.",
    category: "nfpa_pack",
    defaultEnabled: false,
  },
] as const;

const templateByCode = new Map(
  INSPECTION_TYPE_TEMPLATES.map((template) => [template.code, template]),
);

export function getInspectionTypeTemplate(
  code: string,
): InspectionTypeTemplate | undefined {
  return templateByCode.get(code.trim().toLowerCase() as InspectionTypeTemplateCode);
}

export function isKnownInspectionTypeTemplateCode(code: string): boolean {
  return getInspectionTypeTemplate(code) !== undefined;
}

export const DEFAULT_BOOTSTRAP_INSPECTION_TYPES = INSPECTION_TYPE_TEMPLATES.filter(
  (template) => template.defaultEnabled,
);

export const NFPA_PACK_TEMPLATES = INSPECTION_TYPE_TEMPLATES.filter(
  (template) => template.category === "nfpa_pack",
);
