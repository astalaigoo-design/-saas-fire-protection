"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createBuildingAsset,
  retireBuildingAsset,
  type BuildingAssetActionResult,
} from "@/lib/assets/actions";
import { assetTypeLabel } from "@/lib/assets/constants";
import { buildingAssetLabel } from "@/lib/assets/format";
import type { BuildingAssetRow } from "@/lib/assets/queries";
import { BuildingAssetEditDialog } from "@/components/buildings/building-asset-edit-dialog";
import { BuildingAssetFormFields } from "@/components/buildings/building-asset-form-fields";
import { formatDate } from "@/lib/dashboard/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const initialState: BuildingAssetActionResult = { ok: false, error: "" };

function AddAssetButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
      {pending ? "Adding…" : "Add to register"}
    </Button>
  );
}

function RetireButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="min-h-10 text-muted-foreground hover:text-destructive"
    >
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

function RetireAssetForm({
  assetId,
  buildingId,
}: {
  assetId: string;
  buildingId: string;
}) {
  const [state, formAction] = useFormState(retireBuildingAsset, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="buildingId" value={buildingId} />
      {state.ok === false && state.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      <RetireButton />
    </form>
  );
}

type BuildingAssetsTabProps = {
  buildingId: string;
  assets: BuildingAssetRow[];
};

export function BuildingAssetsTab({ buildingId, assets }: BuildingAssetsTabProps) {
  const [createState, createAction] = useFormState(createBuildingAsset, initialState);

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h3 className="font-medium text-foreground">Add equipment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Track extinguishers, alarm panels, and other assets with tag numbers and last
              service dates.
            </p>
          </div>
          <form action={createAction} className="space-y-4">
            <input type="hidden" name="buildingId" value={buildingId} />
            {createState.ok === false && createState.error ? (
              <p role="alert" className="text-sm text-destructive">
                {createState.error}
              </p>
            ) : null}
            {createState.ok ? (
              <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
                Equipment added to the register.
              </p>
            ) : null}
            <BuildingAssetFormFields idPrefix="new-asset" />
            <AddAssetButton />
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Asset register ({assets.length})
        </h3>
        {assets.length === 0 ? (
          <EmptyState
            title="No equipment on file"
            description="Import sites in bulk or add extinguishers and panels here before field work."
          />
        ) : (
          <ul className="space-y-3">
            {assets.map((asset) => (
              <li key={asset.id}>
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {buildingAssetLabel(asset)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {assetTypeLabel(asset.assetType)} · {asset.location}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <BuildingAssetEditDialog asset={asset} />
                        <RetireAssetForm assetId={asset.id} buildingId={buildingId} />
                      </div>
                    </div>

                    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="text-muted-foreground">Last service</dt>
                        <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                          {asset.lastServiceAt ? formatDate(asset.lastServiceAt) : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Next due</dt>
                        <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                          {asset.nextServiceDue ? formatDate(asset.nextServiceDue) : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Tag</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {asset.tagNumber?.trim() || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Serial</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {asset.serialNumber?.trim() || "—"}
                        </dd>
                      </div>
                    </dl>

                    {asset.manufacturer || asset.model ? (
                      <p className="text-xs text-muted-foreground">
                        {[asset.manufacturer, asset.model].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}

                    {asset.notes ? (
                      <p className="whitespace-pre-wrap text-sm text-foreground">{asset.notes}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
