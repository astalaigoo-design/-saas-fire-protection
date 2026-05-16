import Link from "next/link";
import type { InspectionListItem } from "@/lib/dashboard/queries";
import { formatDateTime } from "@/lib/dashboard/dates";

type UpcomingInspectionCardProps = {
  inspection: InspectionListItem;
};

function buildingLabel(inspection: InspectionListItem): string {
  return (
    inspection.building.name ??
    `${inspection.building.addressLine1}, ${inspection.building.city}`
  );
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-sky-500/15 text-sky-300",
  in_progress: "bg-amber-500/15 text-amber-300",
};

export function UpcomingInspectionCard({ inspection }: UpcomingInspectionCardProps) {
  const statusClass =
    statusStyles[inspection.status] ?? "bg-slate-700 text-slate-300";

  return (
    <article className="flex min-h-[9rem] flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass}`}
        >
          {inspection.status.replace("_", " ")}
        </span>
        <span className="text-xs text-slate-500">{inspection.inspectionType.name}</span>
      </div>
      <h3 className="mt-3 font-medium leading-snug text-white">
        {buildingLabel(inspection)}
      </h3>
      <p className="mt-1 text-sm text-slate-400">{inspection.building.customer.name}</p>
      <p className="mt-3 text-sm text-amber-400/90">
        {formatDateTime(inspection.scheduledAt)}
      </p>
      {inspection.assignedTo?.name ? (
        <p className="mt-auto pt-3 text-xs text-slate-500">
          Assigned: {inspection.assignedTo.name}
        </p>
      ) : (
        <p className="mt-auto pt-3 text-xs text-slate-600">Unassigned</p>
      )}
      <Link
        href="/dashboard/jobs"
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-amber-400 hover:underline"
      >
        View details
      </Link>
    </article>
  );
}



