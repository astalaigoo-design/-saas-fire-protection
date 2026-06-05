import { JobEquipmentPreview } from "@/components/inspect/job-equipment-preview";
import { formatDate } from "@/lib/dashboard/dates";
import type { PreJobBrief } from "@/lib/inspect/pre-job-brief";

type PreJobBriefCardProps = {
  brief: PreJobBrief;
};

export function PreJobBriefCard({ brief }: PreJobBriefCardProps) {
  return (
    <section
      className="mx-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
      aria-label="Pre-job brief"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400">
        Pre-job brief
      </h2>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Site</p>
          <p className="mt-1 text-sm font-medium text-white">{brief.buildingLabel}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {brief.buildingAddress}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</p>
          <p className="mt-1 text-sm font-medium text-white">{brief.contactName}</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {brief.contactPhone ? (
              <li>
                <a href={`tel:${brief.contactPhone}`} className="text-amber-400 hover:text-amber-300">
                  {brief.contactPhone}
                </a>
              </li>
            ) : (
              <li className="text-slate-500">No phone on file</li>
            )}
            {brief.contactEmail ? (
              <li>
                <a
                  href={`mailto:${brief.contactEmail}`}
                  className="break-all text-amber-400 hover:text-amber-300"
                >
                  {brief.contactEmail}
                </a>
              </li>
            ) : (
              <li className="text-slate-500">No email on file</li>
            )}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Equipment register
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Mark items you service in the field — optional; pass updates last service on submit.
          </p>
          <div className="mt-3">
            <JobEquipmentPreview
              rows={brief.equipment}
              buildingId={brief.buildingId}
              variant="field"
              emptyMessage="No equipment on file for this building."
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Last deficiencies
          </p>
          {brief.lastInspection ? (
            <p className="mt-1 text-xs text-slate-500">
              From {brief.lastInspection.inspectionTypeName} on{" "}
              {formatDate(brief.lastInspection.completedAt)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No prior completed inspection at this site.</p>
          )}
          {brief.deficiencies.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {brief.deficiencies.map((item) => (
                <li
                  key={`${item.label}-${item.notes ?? ""}`}
                  className="rounded-xl border border-red-500/20 bg-red-950/40 px-3 py-2"
                >
                  <p className="text-sm font-medium text-red-100">{item.label}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs text-red-200/70">{item.description}</p>
                  ) : null}
                  {item.notes?.trim() ? (
                    <p className="mt-1 text-xs leading-relaxed text-red-200/90">{item.notes}</p>
                  ) : (
                    <p className="mt-1 text-xs italic text-red-200/60">No note recorded</p>
                  )}
                </li>
              ))}
            </ul>
          ) : brief.lastInspection ? (
            <p className="mt-2 text-sm text-slate-400">No failed items on the last visit.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
