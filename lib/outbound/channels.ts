import {
  getOutboundEmailStatus,
  type OutboundEmailStatus,
} from "@/lib/email/env";
import { getSmsConfigStatus, type SmsConfigStatus } from "@/lib/sms/env";

/** Customer- and staff-facing features that require Resend env vars on the server. */
export const RESEND_DEPENDENT_FEATURES = [
  "Customer report-ready, quote-sent, and visit-scheduled emails (optional per company)",
  "Compliance PDFs emailed to customers after submit",
  "Repair quotes emailed to customers",
  "Quote accept/decline alerts to owners and admins",
  "Due inspection reminder emails (daily cron)",
  "Trial ending reminder emails (cron)",
  "Staff alert email copies to owners and admins",
  "Technician job assigned, rescheduled, and unassigned emails",
] as const;

/** Works without RESEND_API_KEY — still operational. */
export const WORKS_WITHOUT_RESEND = [
  "Compliance PDF download and public share links (/r/…)",
  "Quote public links and customer responses (/q/…) — accept is approval, not payment",
  "In-app staff bell and technician My jobs alerts",
  "Technician SMS when Twilio is configured",
  "Customer SMS for report ready, quote sent, and visit scheduled (optional per company)",
] as const;

export type OutboundChannelsStatus = {
  email: OutboundEmailStatus;
  sms: SmsConfigStatus;
};

export function getOutboundChannelsStatus(): OutboundChannelsStatus {
  return {
    email: getOutboundEmailStatus(),
    sms: getSmsConfigStatus(),
  };
}

export function needsOutboundEmailSetup(status: OutboundChannelsStatus): boolean {
  return !status.email.configured;
}
