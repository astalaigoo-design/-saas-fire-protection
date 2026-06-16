"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  enableInspectionTypePack,
  type EnableInspectionTypePackState,
} from "@/lib/companies/inspection-type-actions";
import type { InspectionTypePackRow } from "@/lib/companies/inspection-type-queries";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InspectionTypePacksSectionProps = {
  packs: InspectionTypePackRow[];
  heading: string;
  description: string;
};

function EnablePackButton({ code, label }: { code: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary" className="min-h-10 shrink-0">
      {pending ? "Adding…" : label}
    </Button>
  );
}

function PackEnableForm({
  code,
  enabled,
}: {
  code: string;
  enabled: boolean;
}) {
  const [state, formAction] = useFormState<
    EnableInspectionTypePackState | undefined,
    FormData
  >(enableInspectionTypePack, undefined);

  if (enabled) {
    return (
      <span className="inline-flex min-h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
        Enabled
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="code" value={code} />
      <EnablePackButton code={code} label="Add to organization" />
      {state && !state.ok ? (
        <p className="max-w-xs text-right text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="max-w-xs text-right text-xs text-emerald-700" role="status">
          Added — available when scheduling jobs.
        </p>
      ) : null}
    </form>
  );
}

export function InspectionTypePacksSection({
  packs,
  heading,
  description,
}: InspectionTypePacksSectionProps) {
  return (
    <section
      id="inspection-type-packs"
      className={cn(orgSectionAnchorClass, "max-w-2xl space-y-4")}
      aria-labelledby="nfpa-packs-heading"
    >
      <div>
        <h2
          id="nfpa-packs-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {packs.map((pack) => (
          <li
            key={pack.code}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium text-foreground">{pack.name}</p>
              <p className="text-sm text-muted-foreground">{pack.description}</p>
            </div>
            <PackEnableForm code={pack.code} enabled={pack.enabled} />
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Monthly, quarterly, and annual inspection types are always available. Enable packs
        here when your team performs system-specific visits.
      </p>
    </section>
  );
}
