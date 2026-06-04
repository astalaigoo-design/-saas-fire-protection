import Link from "next/link";
import type { OutboundChannelsStatus } from "@/lib/outbound/channels";

type OutboundEmailInlineNoticeProps = {
  channels: OutboundChannelsStatus;
  context: "quotes" | "reports";
};

export function OutboundEmailInlineNotice({
  channels,
  context,
}: OutboundEmailInlineNoticeProps) {
  if (channels.email.configured) return null;

  const detail =
    context === "quotes"
      ? "Send quote to customer requires Resend. Public quote links (/q/…) still work."
      : "Auto-email after submit requires Resend. Download PDF and share links still work.";

  return (
    <p
      role="status"
      className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground"
    >
      <span className="font-medium text-foreground">Email delivery off.</span> {detail}{" "}
      <Link
        href="/dashboard/settings#outbound-email"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        Configure outbound email
      </Link>
    </p>
  );
}
