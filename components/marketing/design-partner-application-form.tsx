"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitDesignPartnerApplication,
  type DesignPartnerApplicationState,
} from "@/lib/marketing/design-partner-actions";
import { cn } from "@/lib/utils";

const initialState: DesignPartnerApplicationState | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full sm:w-auto")}
    >
      {pending ? "Sending…" : "Submit application"}
    </button>
  );
}

export function DesignPartnerApplicationForm() {
  const [state, formAction] = useFormState(submitDesignPartnerApplication, initialState);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm sm:p-8">
        <h2 className="font-heading text-xl font-semibold text-foreground">Application received</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{state.message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "min-h-11")}>
            Start free trial
          </Link>
          <Link
            href="/pricing"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
          >
            Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            name="companyName"
            required
            autoComplete="organization"
            className="min-h-11"
            aria-invalid={Boolean(state?.fieldErrors?.companyName)}
          />
          {state?.fieldErrors?.companyName ? (
            <p className="text-sm text-destructive">{state.fieldErrors.companyName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Your name</Label>
          <Input
            id="contactName"
            name="contactName"
            required
            autoComplete="name"
            className="min-h-11"
            aria-invalid={Boolean(state?.fieldErrors?.contactName)}
          />
          {state?.fieldErrors?.contactName ? (
            <p className="text-sm text-destructive">{state.fieldErrors.contactName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="min-h-11"
            aria-invalid={Boolean(state?.fieldErrors?.email)}
          />
          {state?.fieldErrors?.email ? (
            <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile (optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teamSize">Team size (optional)</Label>
          <Input
            id="teamSize"
            name="teamSize"
            placeholder="e.g. 3 techs, 1 office"
            className="min-h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">What would you help us improve? (optional)</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Inspection types, branches, equipment register, quotes…"
          className="min-h-[120px] resize-y"
        />
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
      <p className="text-xs leading-5 text-muted-foreground">
        We review a small number of design partners (2–3 companies). Applying does not create a
        workspace — use{" "}
        <Link href="/sign-up" className="text-primary hover:underline">
          Start free trial
        </Link>{" "}
        if you want to explore the product today.
      </p>
    </form>
  );
}
