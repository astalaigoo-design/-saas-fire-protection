import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  RESEND_DEPENDENT_FEATURES,
  WORKS_WITHOUT_RESEND,
  type OutboundChannelsStatus,
} from "@/lib/outbound/channels";
import { cn } from "@/lib/utils";

type CommandCenterOutboundProps = {
  channels: OutboundChannelsStatus;
};

function ChannelPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
          : "bg-amber-500/15 text-amber-900 dark:text-amber-100",
      )}
    >
      {label}
    </span>
  );
}

export function CommandCenterOutbound({ channels }: CommandCenterOutboundProps) {
  const emailOn = channels.email.configured;
  const smsOn = channels.sms.configured;

  return (
    <Card
      className={cn(
        !emailOn && "border-amber-500/30",
      )}
    >
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Outbound channels</CardTitle>
          <div className="flex flex-wrap gap-2">
            <ChannelPill active={emailOn} label={emailOn ? "Resend email on" : "Resend email off"} />
            <ChannelPill active={smsOn} label={smsOn ? "Twilio SMS on" : "Twilio SMS off"} />
            <ChannelPill active label="In-app alerts on" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 text-sm">
        {!emailOn ? (
          <p className="text-amber-950 dark:text-amber-100">
            Due reminder cron, quote sends, report auto-email, and staff/technician email copies are
            paused until{" "}
            <span className="font-mono text-xs">RESEND_API_KEY</span> and{" "}
            <span className="font-mono text-xs">REPORT_EMAIL_FROM</span> are set on the server.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Operational email sends as{" "}
            <span className="font-mono text-xs">{channels.email.fromAddress}</span>. Technician SMS
            {smsOn ? ` from ${channels.sms.fromNumber ?? "Twilio"}` : " is not configured"}.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Requires Resend
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {RESEND_DEPENDENT_FEATURES.map((line) => (
                <li key={line} className="flex gap-2">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      emailOn ? "bg-emerald-500" : "bg-amber-500",
                    )}
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Works without Resend
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {WORKS_WITHOUT_RESEND.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link
          href="/dashboard/settings#outbound-email"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
        >
          Organization → outbound email
        </Link>
      </CardContent>
    </Card>
  );
}
