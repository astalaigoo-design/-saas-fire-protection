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
import { cn } from "@/lib/utils";

const initialState: CreateCustomerFormState = { ok: false, error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-11 bg-amber-500 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60",
      )}
    >
      {pending ? "Saving…" : "Create customer"}
    </button>
  );
}

export function NewCustomerForm() {
  const [state, formAction] = useFormState(createCustomer, initialState);

  return (
    <Card className="mx-auto max-w-lg bg-slate-900/70 text-white ring-slate-800">
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state.ok === false && state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            >
              {state.error}
            </p>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">
              Name <span className="text-amber-400">*</span>
            </span>
            <Input
              type="text"
              name="name"
              required
              autoComplete="organization"
              className="h-11 border-slate-700 bg-slate-950 text-white"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              className="h-11 border-slate-700 bg-slate-950 text-white"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Phone</span>
            <Input
              type="tel"
              name="phone"
              autoComplete="tel"
              className="h-11 border-slate-700 bg-slate-950 text-white"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SubmitButton />
            <Link
              href="/dashboard/customers"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-11 text-amber-400 hover:bg-transparent hover:text-amber-300",
              )}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
