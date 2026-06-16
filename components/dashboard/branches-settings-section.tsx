"use client";

import { useFormState, useFormStatus } from "react-dom";
import { BranchDefaultsForm } from "@/components/dashboard/branch-defaults-form";
import { createBranch, type CreateBranchFormState } from "@/lib/branches/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";
import { cn } from "@/lib/utils";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";

type BranchesSettingsSectionProps = {
  branches: BranchListItem[];
};

function CreateBranchSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? "Adding…" : "Add branch"}
    </Button>
  );
}

export function BranchesSettingsSection({ branches }: BranchesSettingsSectionProps) {
  const [state, formAction] = useFormState<CreateBranchFormState | undefined, FormData>(
    createBranch,
    undefined,
  );

  return (
    <section
      id="branches"
      className={cn(
        orgSectionAnchorClass,
        "max-w-2xl space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm",
      )}
      aria-labelledby="branches-heading"
    >
      <div>
        <h2 id="branches-heading" className="font-heading text-lg font-semibold text-foreground">
          Branches
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Offices or regions under your company. Set per-branch equipment and CSV import defaults
          below. Each admin or technician is assigned to one branch; customers belong to one branch.
          Owners can filter the dashboard by branch (that filter also applies to imports when the CSV
          branch column is blank).
        </p>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {branches.map((branch) => (
          <li key={branch.id} className="px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">
                {branch.name}
                {branch.isDefault ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Company default
                  </span>
                ) : null}
                {branch.isImportDefault ? (
                  <span className="ml-2 text-xs font-normal text-primary">CSV import default</span>
                ) : null}
              </span>
              <span className="text-muted-foreground">
                {branch.customerCount} customer{branch.customerCount === 1 ? "" : "s"}
              </span>
            </div>
            <BranchDefaultsForm branch={branch} />
          </li>
        ))}
      </ul>

      <form action={formAction} className="space-y-4 rounded-xl border border-border p-4">
        {state?.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <p className="text-sm text-muted-foreground">Branch added.</p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="branch-name">New branch name</Label>
          <Input
            id="branch-name"
            name="name"
            required
            placeholder="e.g. North region"
            className="min-h-11"
          />
        </div>
        <CreateBranchSubmit />
      </form>
    </section>
  );
}
