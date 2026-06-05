import { DeficiencyStatus, QuoteStatus, WorkOrderStatus } from "@prisma/client";
import { formatDate } from "@/lib/dashboard/dates";
import { DEFICIENCY_STATUS_LABELS } from "@/lib/deficiencies/status";
import { formatQuoteCurrency } from "@/lib/quotes/format";
import type { AssetServiceStatus, RepairPipelineRow } from "@/lib/operations/repair-pipeline";
import { workOrderStatusLabel } from "@/lib/work-orders/constants";
import { cn } from "@/lib/utils";

type StepTone = "muted" | "active" | "done" | "warn";

function toneClass(tone: StepTone): string {
  switch (tone) {
    case "done":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "active":
      return "border-primary/40 bg-primary/10 text-primary";
    case "warn":
      return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

function quoteStatusLabel(status: QuoteStatus | null): string {
  switch (status) {
    case QuoteStatus.draft:
      return "Draft";
    case QuoteStatus.sent:
      return "Sent";
    case QuoteStatus.accepted:
      return "Accepted";
    case QuoteStatus.declined:
      return "Declined";
    default:
      return "No quote";
  }
}

function assetStatusLabel(row: RepairPipelineRow): string {
  switch (row.assetServiceStatus) {
    case "updated":
      return row.linkedAsset?.lastServiceAt
        ? `Updated ${formatDate(row.linkedAsset.lastServiceAt)}`
        : "Register updated";
    case "pending":
      return "Awaiting pass re-inspection";
    case "not_linked":
      return "No linked asset";
    case "not_applicable":
      return "Verified (no asset link)";
    default:
      return "—";
  }
}

function deficiencyTone(row: RepairPipelineRow): StepTone {
  if (row.deficiencyStatus === DeficiencyStatus.verified) return "done";
  if (row.deficiencyStatus === DeficiencyStatus.resolved) return "active";
  return row.pipelineStage === "deficiency" ? "active" : "done";
}

function quoteTone(row: RepairPipelineRow): StepTone {
  if (!row.quoteId) return row.pipelineStage === "deficiency" ? "warn" : "muted";
  if (row.quoteStatus === QuoteStatus.accepted) return "done";
  if (row.quoteStatus === QuoteStatus.sent || row.quoteStatus === QuoteStatus.draft) {
    return row.pipelineStage.startsWith("quote") ? "active" : "done";
  }
  return "muted";
}

function workOrderTone(row: RepairPipelineRow): StepTone {
  if (!row.activeWorkOrder) {
    return row.workOrders.length > 0 ? "done" : "muted";
  }
  if (row.activeWorkOrder.status === WorkOrderStatus.completed) return "done";
  return row.pipelineStage === "work_order" ? "active" : "muted";
}

function assetTone(row: RepairPipelineRow): StepTone {
  if (row.assetServiceStatus === "updated") return "done";
  if (row.assetServiceStatus === "pending") {
    return row.pipelineStage === "follow_up_scheduled" ? "active" : "warn";
  }
  return "muted";
}

type PipelineStepProps = {
  label: string;
  value: string;
  hint?: string;
  tone: StepTone;
};

function PipelineStep({ label, value, hint, tone }: PipelineStepProps) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClass(tone))}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {hint ? <p className="mt-0.5 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}

type RepairPipelineStepsProps = {
  row: RepairPipelineRow;
};

export function RepairPipelineSteps({ row }: RepairPipelineStepsProps) {
  const quoteHint =
    row.quoteTotalCents != null && row.quoteCurrency
      ? formatQuoteCurrency(row.quoteTotalCents, row.quoteCurrency)
      : undefined;

  const workOrderHint = row.activeWorkOrder
    ? row.activeWorkOrder.scheduledAt
      ? `Scheduled ${formatDate(row.activeWorkOrder.scheduledAt)}`
      : workOrderStatusLabel(row.activeWorkOrder.status)
    : row.workOrders[0]
      ? `${row.workOrders.length} linked`
      : undefined;

  const assetHint = row.linkedAsset
    ? `${row.linkedAsset.assetTypeLabel}${row.linkedAsset.tagNumber ? ` · ${row.linkedAsset.tagNumber}` : ""}`
    : undefined;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <PipelineStep
        label="Deficiency"
        value={DEFICIENCY_STATUS_LABELS[row.deficiencyStatus]}
        hint={
          row.dueAt ? `Due ${formatDate(row.dueAt)}` : row.sourceCompletedAt ? "From inspection" : undefined
        }
        tone={deficiencyTone(row)}
      />
      <PipelineStep
        label="Quote"
        value={quoteStatusLabel(row.quoteStatus)}
        hint={quoteHint}
        tone={quoteTone(row)}
      />
      <PipelineStep
        label="Work order"
        value={
          row.activeWorkOrder
            ? workOrderStatusLabel(row.activeWorkOrder.status)
            : row.workOrders.length > 0
              ? "Completed / none open"
              : "None"
        }
        hint={workOrderHint}
        tone={workOrderTone(row)}
      />
      <PipelineStep
        label="Equipment register"
        value={assetStatusLabel(row)}
        hint={assetHint}
        tone={assetTone(row)}
      />
    </div>
  );
}
