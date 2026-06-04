"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  reassignPendingInviteBranch,
  type ReassignPendingInviteBranchState,
} from "@/lib/team/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import type { PendingTeamInviteRow } from "@/lib/team/queries";
import { BranchReassignHint } from "@/components/dashboard/branch-reassign-hint";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingInviteBranchFormProps = {
  invite: PendingTeamInviteRow;
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

export function PendingInviteBranchForm({ invite, branches }: PendingInviteBranchFormProps) {
  const [state, formAction] = useFormState<
    ReassignPendingInviteBranchState | undefined,
    FormData
  >(reassignPendingInviteBranch, undefined);

  if (invite.role === "owner") {
    return <span className="text-muted-foreground">All locations</span>;
  }

  if (branches.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {invite.branchName ?? "Default branch"}
      </span>
    );
  }

  const currentBranchId =
    invite.branchId ?? branches.find((b) => b.isDefault)?.id ?? branches[0]?.id ?? "";

  if (branches.length < 2) {
    return (
      <div className="flex flex-col gap-1 sm:items-end">
        <span className="text-sm text-foreground">{invite.branchName ?? "Default branch"}</span>
        <BranchReassignHint />
      </div>
    );
  }

  return (
    <form
      key={`${invite.id}-${invite.branchId ?? "none"}`}
      action={formAction}
      className="flex w-full flex-col gap-2 sm:w-auto sm:items-end"
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <input type="hidden" name="invitationId" value={invite.id} />
        <label className="sr-only" htmlFor={`pending-branch-${invite.id}`}>
          Branch for {invite.emailAddress}
        </label>
        <select
          id={`pending-branch-${invite.id}`}
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
          {invite.emailAddress} will join {state.branchName}. A fresh invite email was sent.
        </p>
      ) : null}
    </form>
  );
}
