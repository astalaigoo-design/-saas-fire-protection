import { formatDateTime } from "@/lib/dashboard/dates";

type PortalUpcomingVisitsProps = {
  visits: {
    id: string;
    buildingLabel: string;
    inspectionTypeName: string;
    scheduledAt: Date;
    assignedTechnicianName: string | null;
  }[];
};

export function PortalUpcomingVisits({ visits }: PortalUpcomingVisitsProps) {
  if (visits.length === 0) return null;

  return (
    <section aria-labelledby="portal-upcoming-heading" className="space-y-3">
      <h2 id="portal-upcoming-heading" className="text-lg font-semibold text-white">
        Upcoming visits
      </h2>
      <ul className="space-y-3">
        {visits.map((visit) => (
          <li
            key={visit.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4"
          >
            <p className="font-medium text-white">{visit.buildingLabel}</p>
            <p className="mt-1 text-sm text-slate-300">{visit.inspectionTypeName}</p>
            <p className="mt-2 text-sm text-amber-400/90">{formatDateTime(visit.scheduledAt)}</p>
            {visit.assignedTechnicianName ? (
              <p className="mt-1 text-xs text-slate-500">
                Technician: {visit.assignedTechnicianName}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Technician to be assigned</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
