"use client";

import { BuildingAssetTagFields } from "@/components/buildings/building-asset-tag-fields";
import { ASSET_TYPES } from "@/lib/assets/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/lib/ui/native-select";
import type { AssetType } from "@prisma/client";

type BuildingAssetFormFieldsProps = {
  idPrefix: string;
  defaults?: {
    assetType?: AssetType;
    tagNumber?: string | null;
    barcodeValue?: string | null;
    location?: string;
    manufacturer?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    lastServiceAt?: string;
    nextServiceDue?: string;
    notes?: string | null;
  };
};

export function BuildingAssetFormFields({ idPrefix, defaults }: BuildingAssetFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-assetType`}>
          Equipment type <span className="text-primary">*</span>
        </Label>
        <select
          id={`${idPrefix}-assetType`}
          name="assetType"
          required
          defaultValue={defaults?.assetType ?? "fire_extinguisher"}
          className={nativeSelectClassName}
        >
          {ASSET_TYPES.map((row) => (
            <option key={row.value} value={row.value}>
              {row.label}
            </option>
          ))}
        </select>
      </div>

      <BuildingAssetTagFields
        idPrefix={idPrefix}
        defaultTagNumber={defaults?.tagNumber ?? ""}
        defaultBarcodeValue={defaults?.barcodeValue ?? ""}
      />

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-location`}>
          Location on site <span className="text-primary">*</span>
        </Label>
        <Input
          id={`${idPrefix}-location`}
          name="location"
          required
          defaultValue={defaults?.location ?? ""}
          placeholder="2nd floor · east stair"
          className="min-h-11"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-manufacturer`}>Manufacturer</Label>
          <Input
            id={`${idPrefix}-manufacturer`}
            name="manufacturer"
            defaultValue={defaults?.manufacturer ?? ""}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-model`}>Model</Label>
          <Input
            id={`${idPrefix}-model`}
            name="model"
            defaultValue={defaults?.model ?? ""}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-serialNumber`}>Serial number</Label>
          <Input
            id={`${idPrefix}-serialNumber`}
            name="serialNumber"
            defaultValue={defaults?.serialNumber ?? ""}
            className="min-h-11"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-lastServiceAt`}>Last service date</Label>
          <Input
            id={`${idPrefix}-lastServiceAt`}
            name="lastServiceAt"
            type="date"
            defaultValue={defaults?.lastServiceAt ?? ""}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nextServiceDue`}>Next service due</Label>
          <Input
            id={`${idPrefix}-nextServiceDue`}
            name="nextServiceDue"
            type="date"
            defaultValue={defaults?.nextServiceDue ?? ""}
            className="min-h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={2}
          defaultValue={defaults?.notes ?? ""}
          placeholder="Hydro date, cabinet key, AHJ sticker…"
        />
      </div>
    </div>
  );
}
