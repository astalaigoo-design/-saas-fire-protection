import type { InspectionStatus } from "@prisma/client";

const statusStyles: Record<InspectionStatus, string> = {
  scheduled: "bg-sky-500/15 text-sky-300",
  in_progress: "bg-amber-500/15 text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-slate-600/40 text-slate-400",
};

const statusLabels: Record<InspectionStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

type InspectionStatusBadgeProps = {
  status: InspectionStatus;
};

export function InspectionStatusBadge({ status }: InspectionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
