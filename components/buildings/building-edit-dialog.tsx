"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateBuilding, type BuildingActionResult } from "@/lib/buildings/actions";
import { BUILDING_TYPES } from "@/lib/buildings/constants";
import type { BuildingDetailRecord } from "@/lib/buildings/queries";
import { nativeSelectClassName } from "@/lib/ui/native-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: BuildingActionResult = { ok: false, error: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

type BuildingEditDialogProps = {
  building: BuildingDetailRecord;
};

export function BuildingEditDialog({ building }: BuildingEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(updateBuilding, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn("min-h-10")} render={<Button variant="outline" />}>
        Edit building
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit building</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="buildingId" value={building.id} />
          {state.ok === false && state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display name</Label>
            <Input id="edit-name" name="name" defaultValue={building.name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address1">Address line 1</Label>
            <Input
              id="edit-address1"
              name="addressLine1"
              required
              defaultValue={building.addressLine1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address2">Address line 2</Label>
            <Input
              id="edit-address2"
              name="addressLine2"
              defaultValue={building.addressLine2 ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input id="edit-city" name="city" required defaultValue={building.city} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-region">State / region</Label>
              <Input id="edit-region" name="region" required defaultValue={building.region} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-postal">Postal code</Label>
              <Input
                id="edit-postal"
                name="postalCode"
                required
                defaultValue={building.postalCode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Input id="edit-country" name="country" defaultValue={building.country} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Building type</Label>
              <select
                id="edit-type"
                name="buildingType"
                defaultValue={building.buildingType ?? ""}
                className={nativeSelectClassName}
              >
                <option value="">Not specified</option>
                {BUILDING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-district">Fire district / jurisdiction</Label>
              <Input
                id="edit-district"
                name="fireDistrict"
                defaultValue={building.fireDistrict ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">General notes</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              rows={4}
              defaultValue={building.notes ?? ""}
            />
          </div>
          <SaveButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
