import Link from "next/link";
import { buildingTypeLabel } from "@/lib/buildings/constants";
import { buildingDisplayName, buildingFullAddress } from "@/lib/buildings/format";
import type { BuildingDetailPageData } from "@/lib/buildings/queries";
import { BuildingEditDialog } from "@/components/buildings/building-edit-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuildingHeaderProps = {
  data: BuildingDetailPageData;
  canEdit: boolean;
};

export function BuildingHeader({ data, canEdit }: BuildingHeaderProps) {
  const { building } = data;
  const addressLines = buildingFullAddress(building);

  return (
    <header className="space-y-4">
      <Link
        href={`/dashboard/customers/${building.customer.id}`}
        className={cn(
          buttonVariants({ variant: "link", size: "sm" }),
          "h-auto min-h-11 justify-start p-0",
        )}
      >
        ← {building.customer.name}
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {buildingDisplayName(building)}
          </h1>
          <address className="not-italic text-sm text-muted-foreground">
            {addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Building type</dt>
              <dd className="font-medium text-foreground">
                {buildingTypeLabel(building.buildingType)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fire district / jurisdiction</dt>
              <dd className="font-medium text-foreground">
                {building.fireDistrict?.trim() || "Not specified"}
              </dd>
            </div>
          </dl>
        </div>
        {canEdit ? <BuildingEditDialog building={building} /> : null}
      </div>
    </header>
  );
}
