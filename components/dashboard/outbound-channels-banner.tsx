import Link from "next/link";
import type { OutboundChannelsStatus } from "@/lib/outbound/channels";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OutboundChannelsBannerProps = {
  channels: OutboundChannelsStatus;
};

export function OutboundChannelsBanner({ channels }: OutboundChannelsBannerProps) {
  if (channels.email.configured) return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-foreground"
    >
      <p className="font-medium">Outbound email is not configured</p>
      <p className="mt-1 text-muted-foreground">
        Quotes, compliance report delivery, due reminders, staff email copies, and technician job
        emails all use{" "}
        <a
          href="https://resend.com"
          className="font-medium text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Resend
        </a>{" "}
        (<span className="font-mono text-xs">RESEND_API_KEY</span> +{" "}
        <span className="font-mono text-xs">REPORT_EMAIL_FROM</span> on the server). PDFs and
        share links still work; in-app alerts and{" "}
        {channels.sms.configured ? "SMS to technicians" : "My jobs"} do not replace customer email.
      </p>
      <Link
        href="/dashboard/settings#outbound-email"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 min-h-9")}
      >
        View setup checklist
      </Link>
    </div>
  );
}
