import { getReportEmailFrom, isOutboundEmailConfigured } from "@/lib/email/env";
import { APP_NAME } from "@/lib/branding";
import { getAppOrigin } from "@/lib/app-url";
import { Resend } from "resend";

export type TechnicianJobEmailKind = "assigned" | "rescheduled" | "unassigned";

export type SendTechnicianJobEmailInput = {
  to: string;
  technicianName: string | null;
  companyName: string;
  kind: TechnicianJobEmailKind;
  inspectionTypeName: string;
  buildingLabel: string;
  scheduledAt: Date;
  previousScheduledAt?: Date | null;
  inspectionId: string;
  occurrenceNote?: string | null;
  /** When reassigned to another technician. */
  newAssigneeName?: string | null;
};

export type SendTechnicianJobEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function subjectFor(input: SendTechnicianJobEmailInput): string {
  const site = input.buildingLabel;
  if (input.kind === "rescheduled") {
    return `Job rescheduled — ${site}`;
  }
  if (input.kind === "unassigned") {
    return `Job reassigned — ${site}`;
  }
  return `New job assigned — ${site}`;
}

function bodyFor(input: SendTechnicianJobEmailInput): string {
  const greeting = input.technicianName
    ? `Hi ${escapeHtml(input.technicianName)},`
    : "Hi,";
  const when = formatWhen(input.scheduledAt);
  const jobLine = `<strong>${escapeHtml(input.inspectionTypeName)}</strong> at <strong>${escapeHtml(input.buildingLabel)}</strong>`;

  if (input.kind === "rescheduled") {
    const was = input.previousScheduledAt
      ? ` (was ${escapeHtml(formatWhen(input.previousScheduledAt))})`
      : "";
    return `${greeting}<br/><br/>Your assigned inspection was rescheduled to <strong>${escapeHtml(when)}</strong>${was}.<br/>${jobLine}.`;
  }

  if (input.kind === "unassigned") {
    const reassigned = input.newAssigneeName?.trim()
      ? ` It is now assigned to <strong>${escapeHtml(input.newAssigneeName.trim())}</strong>.`
      : " It was removed from your schedule.";
    return `${greeting}<br/><br/>You are no longer assigned to this job on <strong>${escapeHtml(when)}</strong>.<br/>${jobLine}.${reassigned}`;
  }

  const extra = input.occurrenceNote
    ? `<br/><br/>${escapeHtml(input.occurrenceNote)}`
    : "";
  return `${greeting}<br/><br/>You have been assigned a field job on <strong>${escapeHtml(when)}</strong>.<br/>${jobLine}.${extra}`;
}

export async function sendTechnicianJobEmail(
  input: SendTechnicianJobEmailInput,
): Promise<SendTechnicianJobEmailResult> {
  if (!isOutboundEmailConfigured()) {
    return {
      ok: false,
      error: "Outbound email is not configured (RESEND_API_KEY / REPORT_EMAIL_FROM).",
    };
  }

  const to = input.to.trim();
  if (!to) {
    return { ok: false, error: "Technician has no email address." };
  }

  const from = getReportEmailFrom();
  if (!from) {
    return { ok: false, error: "REPORT_EMAIL_FROM is missing." };
  }

  const jobUrl =
    input.kind === "unassigned"
      ? `${getAppOrigin()}/dashboard/my-jobs`
      : `${getAppOrigin()}/inspect/${encodeURIComponent(input.inspectionId)}`;
  const ctaLabel =
    input.kind === "unassigned" ? "View My jobs" : `Open job in ${escapeHtml(APP_NAME)}`;
  const html = `
    <p style="font-family:system-ui,sans-serif;font-size:15px;color:#111;line-height:1.5;">
      ${bodyFor(input)}
    </p>
    <p style="margin-top:20px;">
      <a href="${escapeHtml(jobUrl)}" style="display:inline-block;padding:10px 16px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
        ${ctaLabel}
      </a>
    </p>
    <p style="margin-top:16px;color:#64748b;font-size:13px;">${escapeHtml(input.companyName)}</p>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const result = await resend.emails.send({
    from,
    to,
    subject: subjectFor(input),
    html,
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, messageId: result.data?.id ?? "unknown" };
}
