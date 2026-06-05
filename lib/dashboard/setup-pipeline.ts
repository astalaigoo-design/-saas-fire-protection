export type SetupPipelineStep = {
  id: "customer" | "building" | "schedule";
  label: string;
  href: string;
  done: boolean;
};

export type SetupPipelineState = {
  steps: SetupPipelineStep[];
  /** True when the org has never scheduled an inspection. */
  needsFirstInspection: boolean;
  nextStep: SetupPipelineStep | null;
};

export function buildSetupPipeline(input: {
  customerCount: number;
  buildingCount: number;
  inspectionCount: number;
}): SetupPipelineState {
  const steps: SetupPipelineStep[] = [
    {
      id: "customer",
      label: "Add customer",
      href: "/dashboard/customers/new",
      done: input.customerCount > 0,
    },
    {
      id: "building",
      label: "Add building",
      href: "/dashboard/buildings/new",
      done: input.buildingCount > 0,
    },
    {
      id: "schedule",
      label: input.buildingCount >= 2 ? "Import schedule (CSV)" : "Schedule one job",
      href: input.buildingCount >= 2 ? "/dashboard/jobs/import" : "/dashboard/jobs/new",
      done: input.inspectionCount > 0,
    },
  ];

  const needsFirstInspection = input.inspectionCount === 0;
  const nextStep = steps.find((step) => !step.done) ?? null;

  return { steps, needsFirstInspection, nextStep };
}
