import Link from "next/link";
import { hasTechnicianJobAlertEmail } from "@/lib/notifications/technician-contact";

type MyJobsContactBannerProps = {
  email: string | null | undefined;
  outboundEmailConfigured: boolean;
};

export function MyJobsContactBanner({
  email,
  outboundEmailConfigured,
}: MyJobsContactBannerProps) {
  if (hasTechnicianJobAlertEmail(email)) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <p className="font-medium text-foreground">No email on your account</p>
      <p className="mt-1 text-muted-foreground">
        Job assignment and reschedule emails use the email on your FlareFlow user record (from your
        sign-in account). You still get in-app alerts on this page and the header bell.
        {outboundEmailConfigured
          ? " Add a primary email in your account profile, or ask your owner to use Sync email from sign-in on Organization → Team."
          : " When your company enables outbound email, an address here will be required for job emails."}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Account menu → Manage account (Clerk) to add or verify your email.
      </p>
      <Link
        href="/dashboard/settings"
        className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        Organization settings (owners manage team)
      </Link>
    </div>
  );
}
