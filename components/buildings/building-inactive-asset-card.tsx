import { assetTypeLabel } from "@/lib/assets/constants";
import { buildingAssetLabel } from "@/lib/assets/format";
import type { BuildingAssetRow } from "@/lib/assets/queries";
import { formatDate } from "@/lib/dashboard/dates";
import { Card, CardContent } from "@/components/ui/card";

type BuildingInactiveAssetCardProps = {
  asset: BuildingAssetRow;
};

export function BuildingInactiveAssetCard({ asset }: BuildingInactiveAssetCardProps) {
  const removedAt = asset.retiredAt ?? asset.updatedAt;

  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-muted-foreground">{buildingAssetLabel(asset)}</p>
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Removed
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {assetTypeLabel(asset.assetType)} · {asset.location}
        </p>
        <p className="text-xs text-muted-foreground">
          Removed {formatDate(removedAt)}
          {asset.tagNumber?.trim() ? ` · Tag ${asset.tagNumber.trim()}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
