import { buildingLabel } from "@/lib/customers/format";
import { formatDateTime } from "@/lib/dashboard/dates";
import type { InspectionFormData } from "@/lib/inspect/queries";

type BuildingHeaderProps = {
  inspection: InspectionFormData;
  locked: boolean;
};

export function BuildingHeader({ inspection, locked }: BuildingHeaderProps) {
  const building = inspection.building;

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      {locked ? (
        <p className="mb-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-center text-sm font-medium text-emerald-300">
          Inspection submitted — locked
        </p>
      ) : null}
      <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
        {inspection.inspectionType.name}
      </p>
      <h1 className="mt-1 text-xl font-semibold leading-snug text-white">
        {buildingLabel(building)}
      </h1>
      <p className="mt-1 text-sm text-slate-400">{building.customer.name}</p>
      <p className="mt-2 text-sm text-slate-500">
        {building.addressLine1}
        {building.addressLine2 ? `, ${building.addressLine2}` : ""}
        <br />
        {building.city}, {building.region} {building.postalCode}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Scheduled {formatDateTime(inspection.scheduledAt)}
      </p>
    </header>
  );
}
