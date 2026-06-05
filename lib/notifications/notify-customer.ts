import { publicCustomerPortalUrl } from "@/lib/app-url";
import { buildingLabel } from "@/lib/customers/format";
import { sendCustomerVisitScheduledEmail } from "@/lib/email/send-customer-visit-scheduled-email";
import { resolveCustomerContact } from "@/lib/notifications/customer-contact";
import { getCustomerNotificationSettings } from "@/lib/notifications/customer-settings";
import { prisma } from "@/lib/prisma";
import {
  buildCustomerNotificationSmsBody,
  sendCustomerNotificationSms,
} from "@/lib/sms/send-customer-notification-sms";

export type CustomerNotifyOutcome = {
  email: "sent" | "skipped" | "disabled";
  sms: "sent" | "skipped" | "disabled";
};

const noopOutcome: CustomerNotifyOutcome = { email: "disabled", sms: "disabled" };

export async function notifyCustomerVisitScheduled(input: {
  companyId: string;
  inspectionId: string;
}): Promise<CustomerNotifyOutcome> {
  const settings = await getCustomerNotificationSettings(input.companyId);
  if (!settings) return noopOutcome;

  if (!settings.visitScheduledEmail && !settings.visitScheduledSms) {
    return noopOutcome;
  }

  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: {
      scheduledAt: true,
      inspectionType: { select: { name: true } },
      company: { select: { name: true, reportEmail: true } },
      building: {
        select: {
          name: true,
          addressLine1: true,
          city: true,
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
              portalToken: true,
              portalEnabledAt: true,
            },
          },
        },
      },
    },
  });

  if (!inspection) return noopOutcome;

  const contact = resolveCustomerContact(inspection.building.customer);
  const siteLabel = buildingLabel(inspection.building);
  const portalLink =
    inspection.building.customer.portalEnabledAt &&
    inspection.building.customer.portalToken
      ? publicCustomerPortalUrl(inspection.building.customer.portalToken)
      : null;

  const outcome: CustomerNotifyOutcome = {
    email: settings.visitScheduledEmail ? "skipped" : "disabled",
    sms: settings.visitScheduledSms ? "skipped" : "disabled",
  };

  if (settings.visitScheduledEmail && contact.email) {
    const result = await sendCustomerVisitScheduledEmail({
      to: contact.email,
      customerName: inspection.building.customer.name,
      companyName: inspection.company.name,
      buildingLabel: siteLabel,
      inspectionTypeName: inspection.inspectionType.name,
      scheduledAt: inspection.scheduledAt,
      replyTo: inspection.company.reportEmail,
      portalLink,
    });
    outcome.email = result.ok ? "sent" : "skipped";
    if (!result.ok) {
      console.warn("notifyCustomerVisitScheduled: email failed", result.error);
    }
  }

  if (settings.visitScheduledSms && contact.phoneE164) {
    const link = portalLink ?? `${siteLabel}`;
    const result = await sendCustomerNotificationSms({
      toE164: contact.phoneE164,
      kind: "visit_scheduled",
      companyName: inspection.company.name,
      buildingLabel: siteLabel,
      link,
      scheduledAt: inspection.scheduledAt,
    });
    outcome.sms = result.ok ? "sent" : "skipped";
    if (!result.ok) {
      console.warn("notifyCustomerVisitScheduled: SMS failed", result.error);
    }
  }

  return outcome;
}

export async function notifyCustomerReportReadySms(input: {
  companyId: string;
  buildingLabel: string;
  companyName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  reportLink: string;
}): Promise<"sent" | "skipped" | "disabled"> {
  const settings = await getCustomerNotificationSettings(input.companyId);
  if (!settings?.reportReadySms) return "disabled";

  const contact = resolveCustomerContact({
    email: input.customerEmail,
    phone: input.customerPhone,
  });
  if (!contact.phoneE164) return "skipped";

  const result = await sendCustomerNotificationSms({
    toE164: contact.phoneE164,
    kind: "report_ready",
    companyName: input.companyName,
    buildingLabel: input.buildingLabel,
    link: input.reportLink,
  });

  if (!result.ok) {
    console.warn("notifyCustomerReportReadySms: failed", result.error);
    return "skipped";
  }

  return "sent";
}

export async function notifyCustomerQuoteSentSms(input: {
  companyId: string;
  buildingLabel: string;
  companyName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  quoteLink: string;
  totalLabel: string;
}): Promise<"sent" | "skipped" | "disabled"> {
  const settings = await getCustomerNotificationSettings(input.companyId);
  if (!settings?.quoteSentSms) return "disabled";

  const contact = resolveCustomerContact({
    email: input.customerEmail,
    phone: input.customerPhone,
  });
  if (!contact.phoneE164) return "skipped";

  const result = await sendCustomerNotificationSms({
    toE164: contact.phoneE164,
    kind: "quote_sent",
    companyName: input.companyName,
    buildingLabel: input.buildingLabel,
    link: input.quoteLink,
    totalLabel: input.totalLabel,
  });

  if (!result.ok) {
    console.warn("notifyCustomerQuoteSentSms: failed", result.error);
    return "skipped";
  }

  return "sent";
}

/** Exported for tests. */
export { buildCustomerNotificationSmsBody };
