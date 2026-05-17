import type { InspectionListItem } from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/dashboard/dates";

type RecentInspectionsTableProps = {
  inspections: InspectionListItem[];
};

function buildingLabel(inspection: InspectionListItem): string {
  return (
    inspection.building.name ??
    `${inspection.building.addressLine1}, ${inspection.building.city}`
  );
}

export function RecentInspectionsTable({ inspections }: RecentInspectionsTableProps) {
  if (inspections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
        No completed inspections yet.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Building</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {inspections.map((inspection) => (
              <tr
                key={inspection.id}
                className="bg-slate-900/40 hover:bg-slate-900/70"
              >
                <td className="px-4 py-3 text-slate-100">{buildingLabel(inspection)}</td>
                <td className="px-4 py-3 text-slate-300">
                  {inspection.building.customer.name}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {inspection.inspectionType.name}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {inspection.completedAt ? formatDate(inspection.completedAt) : "—"}
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
            <p className="font-medium text-white">{buildingLabel(inspection)}</p>
            <p className="mt-1 text-sm text-slate-400">
              {inspection.building.customer.name}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="text-slate-200">{inspection.inspectionType.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Completed</dt>
                <dd className="text-slate-200">
                  {inspection.completedAt ? formatDate(inspection.completedAt) : "—"}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
