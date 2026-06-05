import type { OutboundEmailStatus } from "@/lib/email/env";
import type { SmsConfigStatus } from "@/lib/sms/env";
import { NATIVE_APP_PILOT_THRESHOLD } from "@/lib/mobile/scope";
import { cn } from "@/lib/utils";

type TechnicianAlertsSettingsSectionProps = {
  emailStatus: OutboundEmailStatus;
  smsStatus: SmsConfigStatus;
};

export function TechnicianAlertsSettingsSection({
  emailStatus,
  smsStatus,
}: TechnicianAlertsSettingsSectionProps) {
  return (
    <section
      id="technician-alerts"
      className="max-w-lg rounded-xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby="technician-alerts-heading"
    >
      <h2
        id="technician-alerts-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Technician job alerts
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        When you assign, reschedule, or reassign a job, the current and previous technicians are
        notified through the channels below (one assignee per visit — not multi-tech crews).
        Recurring series send one assign alert for the first
        date (with a note); later dates appear on My jobs without duplicate emails. Pilots still
        miss jobs if they only rely on email — encourage My jobs and the in-app bell.
      </p>

      <ul className="mt-4 space-y-3 text-sm">
        <li className="flex gap-3">
          <ChannelBadge active />
          <div>
            <p className="font-medium text-foreground">In-app bell</p>
            <p className="text-muted-foreground">
              Targeted alerts on My jobs, the header, and field checklists (top-right bell). Works
              without Resend — encourage technicians to check it before email.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <ChannelBadge active={emailStatus.configured} />
          <div>
            <p className="font-medium text-foreground">Email (Resend)</p>
            <p className="text-muted-foreground">
              {emailStatus.configured
                ? "Assign, reschedule, and reassignment emails send when User.email is set — check Organization → Team (job alert contact). Invite email or Clerk sign-in sync."
                : "Disabled until outbound email is configured above."}
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <ChannelBadge active={smsStatus.configured} />
          <div>
            <p className="font-medium text-foreground">SMS (Twilio)</p>
            <p className="text-muted-foreground">
              {smsStatus.configured
                ? `Assign, reschedule, reassignment texts + day-of cron (≈7:00 AM ET). From ${smsStatus.fromNumber ?? "configured number"}. Technicians need a mobile on file under Team or My jobs.`
                : "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM on the server."}
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <ChannelBadge active={false} label="Later" />
          <div>
            <p className="font-medium text-foreground">Push notifications</p>
            <p className="text-muted-foreground">
              Web Push via the installed PWA first — native iOS/Android apps deferred until{" "}
              {NATIVE_APP_PILOT_THRESHOLD}+ pilots request them. Would complement SMS for
              assign/reschedule.
            </p>
          </div>
        </li>
      </ul>
    </section>
  );
}

function ChannelBadge({
  active,
  label,
}: {
  active: boolean;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label ?? (active ? "On" : "Off")}
    </span>
  );
}
