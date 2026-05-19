"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { createBuilding, type BuildingActionResult } from "@/lib/buildings/actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/lib/ui/native-select";
import { cn } from "@/lib/utils";

type CustomerOption = {
  id: string;
  name: string;
};

type NewBuildingFormProps = {
  customers: CustomerOption[];
  initialCustomerId?: string;
};

const initialState: BuildingActionResult = { ok: false, error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5 disabled:opacity-60")}
    >
      {pending ? "Saving..." : "Create building"}
    </button>
  );
}

export function NewBuildingForm({ customers, initialCustomerId }: NewBuildingFormProps) {
  const [state, formAction] = useFormState(createBuilding, initialState);
  const defaultCustomerId =
    customers.find((c) => c.id === initialCustomerId)?.id ?? customers[0]?.id ?? "";

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state.ok === false && state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="customerId">
              Customer <span className="text-primary">*</span>
            </Label>
            <select
              id="customerId"
              name="customerId"
              defaultValue={defaultCustomerId}
              className={nativeSelectClassName}
              required
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Building name</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Main Office"
              className="min-h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">
              Address line 1 <span className="text-primary">*</span>
            </Label>
            <Input id="addressLine1" type="text" name="addressLine1" required className="min-h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input id="addressLine2" type="text" name="addressLine2" className="min-h-11" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="city">
                City <span className="text-primary">*</span>
              </Label>
              <Input id="city" type="text" name="city" required className="min-h-11" />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="region">
                State / region <span className="text-primary">*</span>
              </Label>
              <Input id="region" type="text" name="region" required className="min-h-11" />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="postalCode">
                Postal code <span className="text-primary">*</span>
              </Label>
              <Input id="postalCode" type="text" name="postalCode" required className="min-h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" type="text" name="country" defaultValue="US" className="min-h-11" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SubmitButton />
            <Link
              href="/dashboard/buildings"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "min-h-11")}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
