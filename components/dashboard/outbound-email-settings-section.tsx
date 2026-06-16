import type { OutboundEmailStatus } from "@/lib/email/env";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";
import { RESEND_DEPENDENT_FEATURES, WORKS_WITHOUT_RESEND } from "@/lib/outbound/channels";
import { cn } from "@/lib/utils";

type OutboundEmailSettingsSectionProps = {
  status: OutboundEmailStatus;
};

export function OutboundEmailSettingsSection({
  status,
}: OutboundEmailSettingsSectionProps) {
  return (
    <section
      id="outbound-email"
      className={cn(
        orgSectionAnchorClass,
        "max-w-2xl rounded-xl border border-border bg-card p-5 shadow-sm",
      )}
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
            <span className="font-mono text-xs">REPORT_EMAIL_FROM</span>, the Resend-dependent
            features below are disabled. SMS and in-app alerts are separate (see Technician job
            alerts).
          </p>
        ) : null}
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {RESEND_DEPENDENT_FEATURES.map((line) => (
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

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Still works without Resend
      </p>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {WORKS_WITHOUT_RESEND.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
