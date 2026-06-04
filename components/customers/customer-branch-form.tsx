"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  reassignCustomerBranch,
  type ReassignCustomerBranchState,
} from "@/lib/customers/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CustomerBranchFormProps = {
  customerId: string;
  branchId: string;
  branches: BranchListItem[];
};

function SaveBranchButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      className="min-h-9 shrink-0"
    >
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function CustomerBranchForm({
  customerId,
  branchId,
  branches,
}: CustomerBranchFormProps) {
  const [state, formAction] = useFormState<
    ReassignCustomerBranchState | undefined,
    FormData
  >(reassignCustomerBranch, undefined);

  return (
    <form
      key={`${customerId}-${branchId}`}
      action={formAction}
      className="flex w-full flex-col gap-2 sm:w-auto sm:items-end"
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <input type="hidden" name="customerId" value={customerId} />
        <label className="sr-only" htmlFor={`customer-branch-${customerId}`}>
          Branch
        </label>
        <select
          id={`customer-branch-${customerId}`}
          name="branchId"
          defaultValue={branchId}
          className={cn(
            "min-h-9 w-full min-w-[10rem] rounded-md border border-input bg-background px-2 py-1 text-sm",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <SaveBranchButton />
      </div>
      {state?.ok === false ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">
          Moved to {state.branchName}.
        </p>
      ) : null}
    </form>
  );
}
