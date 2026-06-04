"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createBranch, type CreateBranchFormState } from "@/lib/branches/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      className="max-w-lg space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby="branches-heading"
    >
      <div>
        <h2 id="branches-heading" className="font-heading text-lg font-semibold text-foreground">
          Branches
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Offices or regions under your company. Roles stay owner, admin, or technician — there is
          no branch-admin role. Customers belong to one branch; admins and technicians are assigned
          to a single branch. Owners can filter the dashboard by location.
        </p>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {branches.map((branch) => (
          <li key={branch.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="font-medium text-foreground">
              {branch.name}
              {branch.isDefault ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">Default</span>
              ) : null}
            </span>
            <span className="text-muted-foreground">
              {branch.customerCount} customer{branch.customerCount === 1 ? "" : "s"}
            </span>
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
