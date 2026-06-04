import { getAppOrigin } from "@/lib/app-url";
import { isSmsConfigured } from "@/lib/sms/env";
import { sendSmsMessage } from "@/lib/sms/send-message";
import type { TechnicianJobEmailKind } from "@/lib/email/send-technician-job-email";

const SMS_BODY_MAX = 320;

function truncateBody(text: string): string {
  if (text.length <= SMS_BODY_MAX) return text;
  return `${text.slice(0, SMS_BODY_MAX - 1)}…`;
}

function formatWhen(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildBody(input: {
  kind: TechnicianJobEmailKind | "day_of";
  inspectionTypeName: string;
  buildingLabel: string;
  scheduledAt: Date;
  inspectionId: string;
  companyName?: string;
}): string {
  const when = formatWhen(input.scheduledAt);
  const jobUrl = `${getAppOrigin()}/inspect/${encodeURIComponent(input.inspectionId)}`;

  if (input.kind === "day_of") {
    return truncateBody(
      `${input.companyName ?? "GetFlareflow"}: Job today — ${input.inspectionTypeName} at ${input.buildingLabel}, ${when}. ${jobUrl}`,
    );
  }

  if (input.kind === "rescheduled") {
    return truncateBody(
      `Job rescheduled: ${input.inspectionTypeName} at ${input.buildingLabel} — now ${when}. ${jobUrl}`,
    );
  }

  return truncateBody(
    `New job: ${input.inspectionTypeName} at ${input.buildingLabel} — ${when}. ${jobUrl}`,
  );
}

export type SendTechnicianJobSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

export async function sendTechnicianJobSms(input: {
  toE164: string;
  kind: TechnicianJobEmailKind | "day_of";
  inspectionTypeName: string;
  buildingLabel: string;
  scheduledAt: Date;
  inspectionId: string;
  companyName?: string;
}): Promise<SendTechnicianJobSmsResult> {
  if (!isSmsConfigured()) {
    return { ok: false, error: "SMS is not configured." };
  }

  const body = buildBody(input);
  return sendSmsMessage({ to: input.toE164, body });
}
