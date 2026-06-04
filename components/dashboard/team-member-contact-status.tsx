"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  syncTeamMemberEmailFromClerk,
  type SyncTeamMemberEmailState,
} from "@/lib/team/actions";
import type { TeamMemberRow } from "@/lib/team/queries";
import {
  hasTechnicianJobAlertEmail,
  hasTechnicianJobAlertPhone,
} from "@/lib/notifications/technician-contact";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TeamMemberContactStatusProps = {
  member: TeamMemberRow;
  outboundEmailConfigured: boolean;
};

function SyncEmailButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="min-h-9">
      {pending ? "Syncing…" : "Sync email from sign-in"}
    </Button>
  );
}

function ContactPill({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        ok
          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
          : "bg-amber-500/15 text-amber-900 dark:text-amber-100",
      )}
    >
      {label}
    </span>
  );
}

export function TeamMemberContactStatus({
  member,
  outboundEmailConfigured,
}: TeamMemberContactStatusProps) {
  const [syncState, syncAction] = useFormState<
    SyncTeamMemberEmailState | undefined,
    FormData
  >(syncTeamMemberEmailFromClerk, undefined);

  if (member.role !== "technician") return null;

  const hasEmail = hasTechnicianJobAlertEmail(member.email);
  const hasPhone = hasTechnicianJobAlertPhone(member.phone);

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2">
      <p className="text-xs font-medium text-foreground">Job alert contact</p>
      <div className="flex flex-wrap gap-2">
        <ContactPill
          ok={hasEmail}
          label={hasEmail ? "Email on file" : "No email on file"}
        />
        <ContactPill
          ok={hasPhone}
          label={hasPhone ? "Mobile on file" : "No mobile on file"}
        />
      </div>
      {!hasEmail ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          <p role="status">
            Assign/reschedule job emails only send when{" "}
            <span className="font-medium text-foreground">User.email</span> is set — usually
            copied from their Clerk sign-in address when they join. Invites use the invite email;
            if this row is empty, sync or ask them to add a primary email in their account.
          </p>
          {outboundEmailConfigured ? (
            <form action={syncAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="userId" value={member.id} />
              <SyncEmailButton />
            </form>
          ) : (
            <p>Outbound email (Resend) is off — fixing this row still helps once email is enabled.</p>
          )}
          {syncState?.ok === true ? (
            <p role="status" className="text-emerald-700 dark:text-emerald-300">
              Synced {syncState.email}.
            </p>
          ) : null}
          {syncState?.ok === false ? (
            <p role="alert" className="text-destructive">
              {syncState.error}
            </p>
          ) : null}
        </div>
      ) : !outboundEmailConfigured ? (
        <p className="text-xs text-muted-foreground">
          Email on file ({member.email}). Job emails send when Resend is configured above.
        </p>
      ) : null}
      {!hasPhone ? (
        <p className="text-xs text-muted-foreground">
          Add a mobile below for SMS when Twilio is on.
        </p>
      ) : null}
    </div>
  );
}
