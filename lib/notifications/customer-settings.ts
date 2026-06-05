import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type CustomerNotificationSettings = {
  reportReadyEmail: boolean;
  reportReadySms: boolean;
  quoteSentEmail: boolean;
  quoteSentSms: boolean;
  visitScheduledEmail: boolean;
  visitScheduledSms: boolean;
};

const companyNotificationSelect = {
  notifyCustomerReportReadyEmail: true,
  notifyCustomerReportReadySms: true,
  notifyCustomerQuoteSentEmail: true,
  notifyCustomerQuoteSentSms: true,
  notifyCustomerVisitScheduledEmail: true,
  notifyCustomerVisitScheduledSms: true,
} as const;

function mapCompanyRow(
  row: {
    notifyCustomerReportReadyEmail: boolean;
    notifyCustomerReportReadySms: boolean;
    notifyCustomerQuoteSentEmail: boolean;
    notifyCustomerQuoteSentSms: boolean;
    notifyCustomerVisitScheduledEmail: boolean;
    notifyCustomerVisitScheduledSms: boolean;
  },
): CustomerNotificationSettings {
  return {
    reportReadyEmail: row.notifyCustomerReportReadyEmail,
    reportReadySms: row.notifyCustomerReportReadySms,
    quoteSentEmail: row.notifyCustomerQuoteSentEmail,
    quoteSentSms: row.notifyCustomerQuoteSentSms,
    visitScheduledEmail: row.notifyCustomerVisitScheduledEmail,
    visitScheduledSms: row.notifyCustomerVisitScheduledSms,
  };
}

export async function getCustomerNotificationSettings(
  companyId: string,
): Promise<CustomerNotificationSettings | null> {
  const row = await prisma.company.findFirst({
    where: { id: companyId },
    select: companyNotificationSelect,
  });
  return row ? mapCompanyRow(row) : null;
}

function checkboxValue(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export const updateCustomerNotificationSettingsSchema = z.object({
  reportReadyEmail: z.boolean(),
  reportReadySms: z.boolean(),
  quoteSentEmail: z.boolean(),
  quoteSentSms: z.boolean(),
  visitScheduledEmail: z.boolean(),
  visitScheduledSms: z.boolean(),
});

export type UpdateCustomerNotificationSettingsInput = z.infer<
  typeof updateCustomerNotificationSettingsSchema
>;

export function parseCustomerNotificationForm(
  formData: FormData,
): UpdateCustomerNotificationSettingsInput {
  return updateCustomerNotificationSettingsSchema.parse({
    reportReadyEmail: checkboxValue(formData, "reportReadyEmail"),
    reportReadySms: checkboxValue(formData, "reportReadySms"),
    quoteSentEmail: checkboxValue(formData, "quoteSentEmail"),
    quoteSentSms: checkboxValue(formData, "quoteSentSms"),
    visitScheduledEmail: checkboxValue(formData, "visitScheduledEmail"),
    visitScheduledSms: checkboxValue(formData, "visitScheduledSms"),
  });
}
