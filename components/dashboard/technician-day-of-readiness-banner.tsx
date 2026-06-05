import Link from "next/link";
import { formatDateTime } from "@/lib/dashboard/dates";
import type { TechnicianDayOfReadinessRow } from "@/lib/scheduling/technician-day-of-readiness";

type TechnicianDayOfReadinessBannerProps = {
  rows: TechnicianDayOfReadinessRow[];
};

export function TechnicianDayOfReadinessBanner({
  rows,
}: TechnicianDayOfReadinessBannerProps) {
  if (rows.length === 0) return null;

  const preview = rows.slice(0, 3);
  const remaining = rows.length - preview.length;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      <p className="font-medium">
        {rows.length === 1
          ? "1 job today has no technician mobile number for SMS."
          : `${rows.length} jobs today have no technician mobile number for SMS.`}
      </p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
        Day-of texts go out around 7 AM Eastern. Ask technicians to add a number on My jobs, or
        assign from Organization → Team.
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {preview.map((row) => (
          <li key={row.inspectionId}>
            <Link
              href={`/dashboard/jobs/${row.inspectionId}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {row.buildingLabel}
            </Link>
            {" · "}
            {formatDateTime(row.scheduledAt)}
            {" · "}
            {row.technicianName}
          </li>
        ))}
      </ul>
      {remaining > 0 ? (
        <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-100/80">
          +{remaining} more without SMS contact
        </p>
      ) : null}
    </div>
  );
}
