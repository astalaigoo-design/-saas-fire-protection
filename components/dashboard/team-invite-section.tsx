"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  inviteTeamMember,
  type InviteTeamMemberState,
} from "@/lib/team/actions";
import { PendingInviteBranchForm } from "@/components/dashboard/pending-invite-branch-form";
import { TeamMemberBranchForm } from "@/components/dashboard/team-member-branch-form";
import { TeamMemberContactStatus } from "@/components/dashboard/team-member-contact-status";
import { TeamMemberPhoneForm } from "@/components/dashboard/team-member-phone-form";
import { technicianContactGaps } from "@/lib/notifications/technician-contact";
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
  outboundEmailConfigured: boolean;
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

export function TeamInviteSection({
  members,
  pendingInvites,
  branches,
  outboundEmailConfigured,
}: TeamInviteSectionProps) {
  const defaultBranchId = branches.find((b) => b.isDefault)?.id ?? branches[0]?.id ?? "";
  const techniciansMissingContact = members.filter(
    (m) => technicianContactGaps(m).length > 0,
  ).length;
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
          Invite technicians or admins, then use the branch dropdown in Current team to move someone
          after they join. Technicians need an email on file for job emails (invite address or Clerk
          sign-in) and a mobile for SMS.
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
            Technicians see assigned inspections only. Admins manage customers and jobs; choose a
            branch above to keep them on one location (same admin role — not a separate branch-admin).
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
          <p className="mt-1 text-xs text-muted-foreground">
            Fix a wrong-branch invite: pick a new branch for each admin or technician, then Save.
            Owners stay company-wide. Check job alert contact for each technician — missing email is
            the most common reason assign emails do not send.
          </p>
          {techniciansMissingContact > 0 ? (
            <p role="status" className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
              {techniciansMissingContact} technician
              {techniciansMissingContact === 1 ? "" : "s"} missing email and/or mobile for job alerts.
            </p>
          ) : null}
          <div className="mt-3 hidden border-b border-border pb-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_14rem] sm:gap-3">
            <span>Member</span>
            <span className="text-right">Branch</span>
          </div>
          <ul className="divide-y divide-border sm:mt-0">
            {members.map((member) => (
              <li key={member.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_14rem] sm:items-start sm:gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.name ?? member.email ?? "Team member"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.email ? `${member.email} · ` : ""}
                      {roleLabel(member.role)}
                      {member.role !== "owner" && member.branchName
                        ? ` · ${member.branchName}`
                        : null}
                    </p>
                  </div>
                  <div className="sm:min-w-[14rem]">
                    <p className="mb-1 text-xs font-medium text-muted-foreground sm:sr-only">
                      Branch
                    </p>
                    <TeamMemberBranchForm member={member} branches={branches} />
                    <TeamMemberContactStatus
                      member={member}
                      outboundEmailConfigured={outboundEmailConfigured}
                    />
                    <TeamMemberPhoneForm member={member} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pendingInvites.length > 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Pending invitations</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Adjust branch before they accept. Saving sends a new invite email with the updated
            branch.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{invite.emailAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabel(invite.role)} · invited{" "}
                      {invite.createdAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {invite.branchName && branches.length === 0
                        ? ` · ${invite.branchName}`
                        : null}
                    </p>
                  </div>
                  <div className="sm:min-w-[14rem]">
                    <p className="mb-1 text-xs font-medium text-muted-foreground sm:sr-only">
                      Branch
                    </p>
                    <PendingInviteBranchForm invite={invite} branches={branches} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
