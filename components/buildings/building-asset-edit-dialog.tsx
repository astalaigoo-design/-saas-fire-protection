"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateBuildingAsset, type BuildingAssetActionResult } from "@/lib/assets/actions";
import { assetTypeLabel } from "@/lib/assets/constants";
import { toDateInputValue } from "@/lib/assets/format";
import type { BuildingAssetRow } from "@/lib/assets/queries";
import { BuildingAssetFormFields } from "@/components/buildings/building-asset-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const initialState: BuildingAssetActionResult = { ok: false, error: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

type BuildingAssetEditDialogProps = {
  asset: BuildingAssetRow;
};

export function BuildingAssetEditDialog({ asset }: BuildingAssetEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(updateBuildingAsset, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn("min-h-10")} render={<Button variant="outline" size="sm" />}>
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assetTypeLabel(asset.assetType)}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="assetId" value={asset.id} />
          <input type="hidden" name="buildingId" value={asset.buildingId} />
          {state.ok === false && state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <BuildingAssetFormFields
            idPrefix={`edit-${asset.id}`}
            defaults={{
              assetType: asset.assetType,
              tagNumber: asset.tagNumber,
              barcodeValue: asset.barcodeValue,
              location: asset.location,
              manufacturer: asset.manufacturer,
              model: asset.model,
              serialNumber: asset.serialNumber,
              lastServiceAt: toDateInputValue(asset.lastServiceAt),
              nextServiceDue: toDateInputValue(asset.nextServiceDue),
              notes: asset.notes,
            }}
          />
          <SaveButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
