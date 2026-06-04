"use client";

import { useState, useTransition } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { retryWorkspaceProvisioning } from "@/lib/dashboard/provision-workspace-actions";
import { cn } from "@/lib/utils";

type AccountSetupPanelProps = {
  initialError?: string;
  clerkUserIdPrefix: string;
};

export function AccountSetupPanel({
  initialError,
  clerkUserIdPrefix,
}: AccountSetupPanelProps) {
  const [error, setError] = useState(initialError ?? null);
  const [pending, startTransition] = useTransition();

  function connectWorkspace() {
    setError(null);
    startTransition(async () => {
      const result = await retryWorkspaceProvisioning();
      if (!result.ok) {
        setError(result.userMessage);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Connect your workspace
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            You&apos;re signed in with Clerk, but GetFlareflow still needs to link your account in
            our database. This usually completes automatically — you don&apos;t need to wait for the
            Clerk webhook.
          </p>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What we try automatically</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Create or join your company in the database</li>
            <li>Sync role and company into Clerk metadata</li>
            <li>Recover from stale invite metadata if the webhook was delayed</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={connectWorkspace}
            disabled={pending}
            className={cn(buttonVariants(), "min-h-11")}
          >
            {pending ? "Connecting…" : "Connect workspace"}
          </button>
          <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11 w-full")}
            >
              Sign out and use a different account
            </button>
          </SignOutButton>
        </div>

        <p className="text-xs text-muted-foreground">
          Still stuck after retry? Email{" "}
          <a href="mailto:support@getflareflow.com" className="text-primary hover:underline">
            support@getflareflow.com
          </a>{" "}
          with the email you used to sign in and reference{" "}
          <span className="font-mono text-[11px]">{clerkUserIdPrefix}</span>.
        </p>
      </section>
    </main>
  );
}
