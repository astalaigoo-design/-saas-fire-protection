import { InspectionStatusBadge } from "@/components/customers/inspection-status-badge";
import { formatDate, formatDateTime } from "@/lib/dashboard/dates";
import { buildingLabel } from "@/lib/customers/format";
import type { CustomerInspectionHistoryItem } from "@/lib/customers/queries";

type CustomerInspectionHistoryProps = {
  inspections: CustomerInspectionHistoryItem[];
};

export function CustomerInspectionHistory({
  inspections,
}: CustomerInspectionHistoryProps) {
  if (inspections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
        No inspections recorded for this customer yet.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Building</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {inspections.map((inspection) => (
              <tr key={inspection.id} className="bg-slate-900/40">
                <td className="px-4 py-3 text-slate-300">
                  {inspection.status === "completed" && inspection.completedAt
                    ? formatDate(inspection.completedAt)
                    : formatDateTime(inspection.scheduledAt)}
                </td>
                <td className="px-4 py-3 text-slate-100">
                  {buildingLabel(inspection.building)}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {inspection.inspectionType.name}
                </td>
                <td className="px-4 py-3">
                  <InspectionStatusBadge status={inspection.status} />
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {inspection.assignedTo?.name ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {inspections.map((inspection) => (
          <li
            key={inspection.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-white">{buildingLabel(inspection.building)}</p>
              <InspectionStatusBadge status={inspection.status} />
            </div>
            <p className="mt-1 text-sm text-slate-400">{inspection.inspectionType.name}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-slate-500">Date</dt>
                <dd className="text-slate-200">
                  {inspection.status === "completed" && inspection.completedAt
                    ? formatDate(inspection.completedAt)
                    : formatDateTime(inspection.scheduledAt)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Assigned</dt>
                <dd className="text-slate-200">
                  {inspection.assignedTo?.name ?? "—"}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
