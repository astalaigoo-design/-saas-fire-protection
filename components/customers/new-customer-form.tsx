"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createCustomer,
  type CreateCustomerFormState,
} from "@/lib/customers/actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateCustomerFormState = { ok: false, error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5 disabled:opacity-60")}
    >
      {pending ? "Saving…" : "Create customer"}
    </button>
  );
}

export function NewCustomerForm() {
  const [state, formAction] = useFormState(createCustomer, initialState);

  return (
    <Card className="mx-auto max-w-lg">
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
            <Label htmlFor="customer-name">
              Name <span className="text-primary">*</span>
            </Label>
            <Input
              id="customer-name"
              type="text"
              name="name"
              required
              autoComplete="organization"
              className="min-h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              name="email"
              autoComplete="email"
              className="min-h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              className="min-h-11"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SubmitButton />
            <Link
              href="/dashboard/customers"
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
