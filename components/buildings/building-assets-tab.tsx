"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AssetQrLabelDialog } from "@/components/scan/asset-qr-label-dialog";
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
import { BuildingAssetRegisterHistory } from "@/components/buildings/building-asset-register-history";
import { BuildingInactiveAssetCard } from "@/components/buildings/building-inactive-asset-card";
import type { AuditEventForDisplay } from "@/lib/audit/format-event";
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

function AssetQrLabelButton({ asset }: { asset: BuildingAssetRow }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10"
        onClick={() => setOpen(true)}
      >
        QR label
      </Button>
      <AssetQrLabelDialog open={open} onClose={() => setOpen(false)} asset={asset} />
    </>
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
  inactiveAssets: BuildingAssetRow[];
  assetAuditHistory: AuditEventForDisplay[];
};

export function BuildingAssetsTab({
  buildingId,
  assets,
  inactiveAssets,
  assetAuditHistory,
}: BuildingAssetsTabProps) {
  const [createState, createAction] = useFormState(createBuildingAsset, initialState);
  const [showRemoved, setShowRemoved] = useState(false);

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h3 className="font-medium text-foreground">Add equipment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Track extinguishers, alarm panels, and other assets with tag numbers and last
              service dates.{" "}
              <Link
                href="/dashboard/buildings/import-equipment"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Import equipment CSV
              </Link>{" "}
              for many sites at once.
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Asset register ({assets.length})
            {inactiveAssets.length > 0 ? (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                · {inactiveAssets.length} removed
              </span>
            ) : null}
          </h3>
          {inactiveAssets.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10 shrink-0"
              aria-pressed={showRemoved}
              onClick={() => setShowRemoved((value) => !value)}
            >
              {showRemoved ? "Hide removed" : `Show removed (${inactiveAssets.length})`}
            </Button>
          ) : null}
        </div>
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
                        <AssetQrLabelButton asset={asset} />
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
                        <dt className="text-muted-foreground">Barcode</dt>
                        <dd className="mt-0.5 break-all font-medium text-foreground">
                          {asset.barcodeValue?.trim() || "—"}
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

        {showRemoved && inactiveAssets.length > 0 ? (
          <ul className="space-y-3 border-t border-border pt-4">
            {inactiveAssets.map((asset) => (
              <li key={asset.id}>
                <BuildingInactiveAssetCard asset={asset} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3 border-t border-border pt-8">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">
            Register history
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Adds, edits, and removals on this building. Company-wide activity is in{" "}
            <Link
              href="/dashboard/operations?tab=activity&entity=asset"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Command center → Activity
            </Link>
            .
          </p>
        </div>
        <BuildingAssetRegisterHistory events={assetAuditHistory} />
      </section>
    </div>
  );
}
