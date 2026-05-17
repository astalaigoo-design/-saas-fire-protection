import { buildingAddressLine, buildingLabel } from "@/lib/customers/format";
import type { CustomerDetail } from "@/lib/customers/queries";

type CustomerBuildingsSectionProps = {
  buildings: CustomerDetail["buildings"];
};

export function CustomerBuildingsSection({ buildings }: CustomerBuildingsSectionProps) {
  if (buildings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
        No buildings on file for this customer yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {buildings.map((building) => (
        <li
          key={building.id}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <h3 className="font-medium text-white">{buildingLabel(building)}</h3>
          <p className="mt-1 text-sm text-slate-400">{buildingAddressLine(building)}</p>
          <p className="mt-2 text-xs text-slate-500">
            {building.region} {building.postalCode}
            {building.country !== "US" ? ` · ${building.country}` : ""}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {building._count.inspections}{" "}
            {building._count.inspections === 1 ? "inspection" : "inspections"}
          </p>
        </li>
      ))}
    </ul>
  );
}
