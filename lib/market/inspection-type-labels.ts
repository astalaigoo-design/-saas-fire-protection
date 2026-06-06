import { OperatingMarket } from "@prisma/client";
import {
  DEFAULT_BOOTSTRAP_INSPECTION_TYPES,
  type InspectionTypeTemplate,
  INSPECTION_TYPE_TEMPLATES,
} from "@/lib/inspections/inspection-type-templates";

type LocalizedType = Pick<InspectionTypeTemplate, "code" | "name" | "description">;

const UK_TYPE_OVERRIDES: Partial<
  Record<string, Pick<InspectionTypeTemplate, "name" | "description">>
> = {
  monthly: {
    name: "Monthly fire safety check",
    description: "Broad monthly life-safety walkthrough across systems.",
  },
  quarterly: {
    name: "Quarterly fire safety check",
    description: "Quarterly tests and valve exercises per UK maintenance schedules.",
  },
  annual: {
    name: "Annual fire safety inspection",
    description: "Full annual compliance visit with main drain and annual tests.",
  },
  wet: {
    name: "Wet pipe sprinkler",
    description:
      "BS EN 12845 wet pipe systems — risers, alarm valves, waterflow, and main drain tests.",
  },
  dry: {
    name: "Dry pipe sprinkler",
    description:
      "BS EN 12845 dry pipe and preaction systems — air pressure, dry valves, and trip tests.",
  },
  sprinkler: {
    name: "Sprinkler system (general)",
    description:
      "BS EN 12845 combined sprinkler visit — heads, valves, gauges, inlets, and fire pump checks.",
  },
  alarm: {
    name: "Fire detection & alarm",
    description: "BS 5839-1 fire alarm inspection pack — panel, devices, and notification.",
  },
  hood: {
    name: "Kitchen hood suppression",
    description: "BS 7937 commercial cooking hood and fixed extinguishing system pack.",
  },
  kitchen: {
    name: "Commercial kitchen",
    description: "BS 7937 kitchen exhaust and cooking suppression — same focused hood checklist.",
  },
};

export function localizeInspectionTypeTemplate(
  template: InspectionTypeTemplate,
  market: OperatingMarket,
): LocalizedType {
  if (market === OperatingMarket.US) {
    return {
      code: template.code,
      name: template.name,
      description: template.description,
    };
  }

  const override = UK_TYPE_OVERRIDES[template.code];
  return {
    code: template.code,
    name: override?.name ?? template.name,
    description: override?.description ?? template.description,
  };
}

export function getBootstrapInspectionTypesForMarket(
  market: OperatingMarket,
): LocalizedType[] {
  return DEFAULT_BOOTSTRAP_INSPECTION_TYPES.map((template) =>
    localizeInspectionTypeTemplate(template, market),
  );
}

export function getInspectionTypeTemplatesForMarket(
  market: OperatingMarket,
): LocalizedType[] {
  return INSPECTION_TYPE_TEMPLATES.map((template) =>
    localizeInspectionTypeTemplate(template, market),
  );
}
