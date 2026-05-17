"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createCustomer,
  type CreateCustomerFormState,
} from "@/lib/customers/actions";

const initialState: CreateCustomerFormState = { ok: false, error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Create customer"}
    </button>
  );
}

export function NewCustomerForm() {
  const [state, formAction] = useFormState(createCustomer, initialState);

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-6">
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
        <input
          type="text"
          name="name"
          required
          autoComplete="organization"
          className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-300">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-300">Phone</span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        <Link
          href="/dashboard/customers"
          className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-amber-400 hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
