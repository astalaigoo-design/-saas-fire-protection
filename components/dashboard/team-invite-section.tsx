"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  inviteTeamMember,
  type InviteTeamMemberState,
} from "@/lib/team/actions";
import type { BranchListItem } from "@/lib/branches/queries";
import type { PendingTeamInviteRow, TeamMemberRow } from "@/lib/team/queries";
import { INVITABLE_TEAM_ROLES } from "@/lib/team/invite-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TeamInviteSectionProps = {
  members: TeamMemberRow[];
  pendingInvites: PendingTeamInviteRow[];
  branches: BranchListItem[];
};

function roleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "technician":
      return "Technician";
    default:
      return role;
  }
}

function InviteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
      {pending ? "Sending…" : "Send invite"}
    </Button>
  );
}

export function TeamInviteSection({ members, pendingInvites, branches }: TeamInviteSectionProps) {
  const defaultBranchId = branches.find((b) => b.isDefault)?.id ?? branches[0]?.id ?? "";
  const [state, formAction] = useFormState<InviteTeamMemberState | undefined, FormData>(
    inviteTeamMember,
    undefined,
  );

  return (
    <section
      id="team"
      className="max-w-lg space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby="team-heading"
    >
      <div>
        <h2 id="team-heading" className="font-heading text-lg font-semibold text-foreground">
          Team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite field technicians or admins. They receive a Clerk email and join your
          organization automatically with the right access.
        </p>
      </div>

      <form action={formAction} className="space-y-4 rounded-xl border border-border p-4">
        <legend className="sr-only">Invite team member</legend>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tech@yourcompany.com"
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="technician"
            className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {INVITABLE_TEAM_ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Technicians see assigned inspections only. Admins can manage customers and jobs.
          </p>
        </div>
        {branches.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="invite-branch">Branch</Label>
            <select
              id="invite-branch"
              name="branchId"
              defaultValue={defaultBranchId}
              className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Each member is assigned to one branch and only sees that location&apos;s customers and
              jobs.
            </p>
          </div>
        ) : null}

        {state?.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
            Invitation sent to {state.email}. They can accept from the email link.
          </p>
        ) : null}

        <InviteSubmitButton />
      </form>

      {members.length > 0 ? (
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Current team</h3>
          <ul className="mt-3 space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-foreground">
                  {member.name ?? member.email ?? "Team member"}
                </span>
                <span className="text-muted-foreground">
                  {member.email ? (
                    <>
                      {member.email}
                      <span className="mx-2 hidden sm:inline" aria-hidden>
                        ·
                      </span>
                    </>
                  ) : null}
                  <span className="font-medium">{roleLabel(member.role)}</span>
                  {member.branchName ? (
                    <>
                      <span className="mx-2 hidden sm:inline" aria-hidden>
                        ·
                      </span>
                      <span>{member.branchName}</span>
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pendingInvites.length > 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Pending invitations</h3>
          <ul className="mt-3 space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-foreground">{invite.emailAddress}</span>
                <span className="text-muted-foreground">
                  {roleLabel(invite.role)} · invited{" "}
                  {invite.createdAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
