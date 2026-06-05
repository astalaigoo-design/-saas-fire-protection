"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AssetType } from "@prisma/client";
import { ASSET_TYPES, waterSystemAssetTypeLabel } from "@/lib/assets/constants";
import { assetTypeLabel } from "@/lib/assets/constants";
import { DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS } from "@/lib/assets/service-intervals";
import { updateBranchDefaults, type UpdateBranchDefaultsState } from "@/lib/branches/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/lib/ui/native-select";
type BranchDefaultsFormProps = {
  branch: BranchListItem;
};

function SaveDefaultsButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="min-h-9">
      {pending ? "Saving…" : "Save defaults"}
    </Button>
  );
}

export function BranchDefaultsForm({ branch }: BranchDefaultsFormProps) {
  const [state, formAction] = useFormState<UpdateBranchDefaultsState | undefined, FormData>(
    updateBranchDefaults,
    undefined,
  );

  const assetLabel = branch.defaultAssetType
    ? assetTypeLabel(branch.defaultAssetType)
    : "Not set";

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-border pt-3">
      <input type="hidden" name="branchId" value={branch.id} />
      {state?.ok === false ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-xs text-muted-foreground">Branch defaults saved.</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`asset-type-${branch.id}`} className="text-xs">
            Default equipment type
          </Label>
          <select
            id={`asset-type-${branch.id}`}
            name="defaultAssetType"
            defaultValue={branch.defaultAssetType ?? ""}
            className={nativeSelectClassName}
          >
            <option value="">None (require in CSV / form)</option>
            {ASSET_TYPES.map((row) => (
              <option key={row.value} value={row.value}>
                {row.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">Current: {assetLabel}</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`interval-${branch.id}`} className="text-xs">
            Default service interval (months)
          </Label>
          <Input
            id={`interval-${branch.id}`}
            name="defaultServiceIntervalMonths"
            type="number"
            min={1}
            max={60}
            placeholder="e.g. 12"
            defaultValue={branch.defaultServiceIntervalMonths ?? ""}
            className="min-h-9"
          />
          <p className="text-[11px] text-muted-foreground">
            Fills next service due on equipment import when the column is blank.
          </p>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-medium text-foreground">
          Test intervals by equipment type (months)
        </legend>
        <p className="text-[11px] text-muted-foreground">
          Used when next service due is blank on import or manual add. Passing a field test advances
          the due date by this interval.
        </p>
        {(
          [
            AssetType.fire_hydrant,
            AssetType.standpipe,
            AssetType.sprinkler_component,
          ] as const
        ).map((assetType) => {
          const current = branch.waterSystemIntervals.find((row) => row.assetType === assetType);
          return (
            <div key={assetType} className="space-y-1">
              <Label htmlFor={`${branch.id}-${assetType}`} className="text-xs">
                {waterSystemAssetTypeLabel(assetType)}
              </Label>
              <Input
                id={`${branch.id}-${assetType}`}
                name={`serviceInterval_${assetType}`}
                type="number"
                min={1}
                max={60}
                placeholder={String(DEFAULT_WATER_SYSTEM_INTERVAL_MONTHS[assetType])}
                defaultValue={current?.intervalMonths ?? ""}
                className="min-h-11"
              />
            </div>
          );
        })}
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isImportDefault"
          defaultChecked={branch.isImportDefault}
          className="h-4 w-4 accent-primary"
        />
        <span>
          CSV import default branch{" "}
          <span className="text-muted-foreground">
            (when the branch column is empty and no dashboard branch filter is active)
          </span>
        </span>
      </label>

      <SaveDefaultsButton />
    </form>
  );
}
