import { getReportEmailFrom, isReportEmailConfigured } from "@/lib/email/env";
import { listOwnerAdminEmails } from "@/lib/notifications/recipients";
import { APP_NAME } from "@/lib/branding";
import { getAppOrigin } from "@/lib/app-url";
import { Resend } from "resend";

export type SendStaffNotificationEmailsInput = {
  companyId: string;
  title: string;
  body: string;
  href?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendStaffNotificationEmails(
  input: SendStaffNotificationEmailsInput,
): Promise<void> {
  if (!isReportEmailConfigured()) return;

  const recipients = await listOwnerAdminEmails(input.companyId);
  if (recipients.length === 0) return;

  const from = getReportEmailFrom();
  if (!from) return;

  const link = input.href?.trim()
    ? input.href.startsWith("http")
      ? input.href
      : `${getAppOrigin()}${input.href.startsWith("/") ? input.href : `/${input.href}`}`
    : `${getAppOrigin()}/dashboard`;

  const html = `
    <p style="font-family:system-ui,sans-serif;font-size:15px;color:#111;">
      ${escapeHtml(input.body)}
    </p>
    <p style="margin-top:20px;">
      <a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 16px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
        Open in ${escapeHtml(APP_NAME)}
      </a>
    </p>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from,
    to: recipients,
    subject: input.title,
    html,
  });
}
