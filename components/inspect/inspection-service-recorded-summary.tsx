import { formatDate } from "@/lib/dashboard/dates";
import type { ServiceRecordedRow } from "@/lib/inspect/job-equipment";

type InspectionServiceRecordedSummaryProps = {
  rows: ServiceRecordedRow[];
};

export function InspectionServiceRecordedSummary({
  rows,
}: InspectionServiceRecordedSummaryProps) {
  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby="service-recorded-heading"
      className="mx-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"
    >
      <h2 id="service-recorded-heading" className="text-base font-semibold text-emerald-200">
        Service recorded
      </h2>
      <p className="mt-1 text-sm text-emerald-100/80">
        {rows.length === 1
          ? "1 item stamped on the building register."
          : `${rows.length} items stamped on the building register.`}
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-3 py-2"
          >
            <p className="font-medium text-emerald-100">{row.label}</p>
            <p className="text-emerald-200/70">
              {row.location} · {formatDate(row.servicedAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
