"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  reassignTeamMemberBranch,
  type ReassignTeamMemberBranchState,
} from "@/lib/team/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import type { TeamMemberRow } from "@/lib/team/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TeamMemberBranchFormProps = {
  member: TeamMemberRow;
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

export function TeamMemberBranchForm({ member, branches }: TeamMemberBranchFormProps) {
  const [state, formAction] = useFormState<
    ReassignTeamMemberBranchState | undefined,
    FormData
  >(reassignTeamMemberBranch, undefined);

  if (member.role === "owner") {
    return <span className="text-muted-foreground">All locations</span>;
  }

  const currentBranchId =
    member.branchId ?? branches.find((b) => b.isDefault)?.id ?? branches[0]?.id ?? "";

  return (
    <form
      key={`${member.id}-${member.branchId ?? "none"}`}
      action={formAction}
      className="flex w-full flex-col gap-2 sm:w-auto sm:items-end"
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <input type="hidden" name="userId" value={member.id} />
        <label className="sr-only" htmlFor={`branch-${member.id}`}>
          Branch for {member.name ?? member.email ?? "team member"}
        </label>
        <select
          id={`branch-${member.id}`}
          name="branchId"
          defaultValue={currentBranchId}
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
          Assigned to {state.branchName}.
        </p>
      ) : null}
    </form>
  );
}
