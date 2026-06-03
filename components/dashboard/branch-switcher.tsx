"use client";

import { useTransition } from "react";
import { setActiveBranch } from "@/lib/branches/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import { cn } from "@/lib/utils";

type BranchSwitcherProps = {
  branches: BranchListItem[];
  activeBranchId: string | null;
  label: string;
};

export function BranchSwitcher({
  branches,
  activeBranchId,
  label,
}: BranchSwitcherProps) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Filter by branch</span>
      <span className="hidden text-muted-foreground sm:inline">Location</span>
      <select
        className={cn(
          "min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground",
          pending && "opacity-60",
        )}
        value={activeBranchId ?? ""}
        disabled={pending}
        aria-label={`Location filter: ${label}`}
        onChange={(event) => {
          const value = event.target.value;
          startTransition(() => {
            void setActiveBranch(value.length > 0 ? value : null);
          });
        }}
      >
        <option value="">All locations</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
            {branch.isDefault ? " (default)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
