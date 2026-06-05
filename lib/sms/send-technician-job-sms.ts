import { getAppOrigin } from "@/lib/app-url";
import { buildMapsSearchUrl } from "@/lib/maps/build-search-url";
import { getDayOfSmsTimeZone } from "@/lib/scheduling/day-of-timezone";
import { isSmsConfigured } from "@/lib/sms/env";
import { sendSmsMessage } from "@/lib/sms/send-message";
import type { TechnicianJobEmailKind } from "@/lib/email/send-technician-job-email";

const SMS_BODY_MAX = 320;

function truncateBody(text: string): string {
  if (text.length <= SMS_BODY_MAX) return text;
  return `${text.slice(0, SMS_BODY_MAX - 1)}…`;
}

function formatWhen(date: Date, timeZone?: string): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
}

function buildBody(input: {
  kind: TechnicianJobEmailKind | "day_of";
  inspectionTypeName: string;
  buildingLabel: string;
  addressLine?: string;
  mapsQuery?: string;
  scheduledAt: Date;
  inspectionId: string;
  companyName?: string;
  newAssigneeName?: string | null;
  occurrenceNote?: string | null;
}): string {
  const when =
    input.kind === "day_of"
      ? formatWhen(input.scheduledAt, getDayOfSmsTimeZone())
      : formatWhen(input.scheduledAt);
  const jobUrl = `${getAppOrigin()}/inspect/${encodeURIComponent(input.inspectionId)}`;

  if (input.kind === "day_of") {
    const address = input.addressLine?.trim() || input.buildingLabel;
    const mapsUrl = input.mapsQuery?.trim()
      ? buildMapsSearchUrl(input.mapsQuery)
      : jobUrl;
    return truncateBody(
      `${input.companyName ?? "GetFlareflow"}: Today ${when} — ${input.inspectionTypeName}, ${address}. ${mapsUrl}`,
    );
  }

  if (input.kind === "rescheduled") {
    return truncateBody(
      `Job rescheduled: ${input.inspectionTypeName} at ${input.buildingLabel} — now ${when}. ${jobUrl}`,
    );
  }

  if (input.kind === "unassigned") {
    const myJobsUrl = `${getAppOrigin()}/dashboard/my-jobs`;
    const reassigned = input.newAssigneeName?.trim()
      ? ` Now assigned to ${input.newAssigneeName.trim()}.`
      : " Removed from your schedule.";
    return truncateBody(
      `Job reassigned: ${input.inspectionTypeName} at ${input.buildingLabel} on ${when}.${reassigned} ${myJobsUrl}`,
    );
  }

  if (input.kind === "assigned" && input.occurrenceNote) {
    return truncateBody(
      `Recurring jobs (${input.occurrenceNote}) ${input.inspectionTypeName} at ${input.buildingLabel} — first visit ${when}. ${jobUrl}`,
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
  addressLine?: string;
  mapsQuery?: string;
  scheduledAt: Date;
  inspectionId: string;
  companyName?: string;
  newAssigneeName?: string | null;
  occurrenceNote?: string | null;
}): Promise<SendTechnicianJobSmsResult> {
  if (!isSmsConfigured()) {
    return { ok: false, error: "SMS is not configured." };
  }

  const body = buildBody(input);
  return sendSmsMessage({ to: input.toE164, body });
}
