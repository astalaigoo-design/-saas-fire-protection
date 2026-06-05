import { isSmsConfigured } from "@/lib/sms/env";
import { sendSmsMessage } from "@/lib/sms/send-message";

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

export type CustomerNotificationSmsKind =
  | "report_ready"
  | "quote_sent"
  | "visit_scheduled";

function buildBody(input: {
  kind: CustomerNotificationSmsKind;
  companyName: string;
  buildingLabel: string;
  link: string;
  scheduledAt?: Date;
  totalLabel?: string;
}): string {
  const company = input.companyName.trim() || "Your contractor";

  if (input.kind === "report_ready") {
    return truncateBody(
      `${company}: Inspection report ready for ${input.buildingLabel}. View: ${input.link}`,
    );
  }

  if (input.kind === "quote_sent") {
    const total = input.totalLabel ? ` (${input.totalLabel})` : "";
    return truncateBody(
      `${company}: Repair quote${total} for ${input.buildingLabel}. View & respond: ${input.link}`,
    );
  }

  const when = input.scheduledAt ? formatWhen(input.scheduledAt) : "soon";
  return truncateBody(
    `${company}: Visit scheduled ${when} at ${input.buildingLabel}. Details: ${input.link}`,
  );
}

export type SendCustomerNotificationSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

export async function sendCustomerNotificationSms(input: {
  toE164: string;
  kind: CustomerNotificationSmsKind;
  companyName: string;
  buildingLabel: string;
  link: string;
  scheduledAt?: Date;
  totalLabel?: string;
}): Promise<SendCustomerNotificationSmsResult> {
  if (!isSmsConfigured()) {
    return { ok: false, error: "SMS is not configured." };
  }

  const body = buildBody(input);
  return sendSmsMessage({ to: input.toE164, body });
}

/** Exported for tests. */
export function buildCustomerNotificationSmsBody(
  input: Parameters<typeof buildBody>[0],
): string {
  return buildBody(input);
}
