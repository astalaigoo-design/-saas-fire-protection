import type { OutboundEmailStatus } from "@/lib/email/env";
import { cn } from "@/lib/utils";

const ENABLED_WHEN_CONFIGURED = [
  "Compliance PDFs emailed to customers after submit",
  "Repair quotes sent to customers",
  "Quote accept/decline alerts to owners and admins",
  "Due inspection reminders (daily cron)",
  "Trial ending reminders (cron)",
  "In-app staff alerts (email copy to owners/admins)",
  "Technician job assigned or rescheduled emails",
] as const;

type OutboundEmailSettingsSectionProps = {
  status: OutboundEmailStatus;
};

export function OutboundEmailSettingsSection({
  status,
}: OutboundEmailSettingsSectionProps) {
  return (
    <section
      id="outbound-email"
      className="max-w-lg rounded-xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby="outbound-email-heading"
    >
      <h2
        id="outbound-email-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Outbound email
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        All operational email is sent through{" "}
        <a
          href="https://resend.com"
          className="font-medium text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Resend
        </a>
        . This is configured on the server (not per company in the app).
      </p>

      <div
        className={cn(
          "mt-4 rounded-lg border px-4 py-3 text-sm",
          status.configured
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
            : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        )}
        role="status"
      >
        <p className="font-medium">
          {status.configured ? "Active" : "Not configured"}
        </p>
        {status.configured && status.fromAddress ? (
          <p className="mt-1 text-muted-foreground">
            Sending as <span className="font-mono text-xs">{status.fromAddress}</span>
          </p>
        ) : null}
        {!status.configured ? (
          <p className="mt-1">
            Without <span className="font-mono text-xs">RESEND_API_KEY</span> and{" "}
            <span className="font-mono text-xs">REPORT_EMAIL_FROM</span>, the features
            below are disabled. PDFs and share links still work; email delivery does not.
          </p>
        ) : null}
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {ENABLED_WHEN_CONFIGURED.map((line) => (
          <li key={line} className="flex gap-2">
            <span
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                status.configured ? "bg-emerald-500" : "bg-muted-foreground/50",
              )}
              aria-hidden
            />
            <span className={status.configured ? "text-foreground" : undefined}>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
