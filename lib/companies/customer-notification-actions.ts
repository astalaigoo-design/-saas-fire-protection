"use server";

import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { parseCustomerNotificationForm } from "@/lib/notifications/customer-settings";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type UpdateCustomerNotificationSettingsState =
  | { ok: true }
  | { ok: false; error: string };

export async function updateCustomerNotificationSettings(
  _prev: UpdateCustomerNotificationSettingsState | undefined,
  formData: FormData,
): Promise<UpdateCustomerNotificationSettingsState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can update notification settings." };
  }

  let parsed;
  try {
    parsed = parseCustomerNotificationForm(formData);
  } catch {
    return { ok: false, error: "Invalid notification settings." };
  }

  try {
    await prisma.company.update({
      where: { id: session.companyId },
      data: {
        notifyCustomerReportReadyEmail: parsed.reportReadyEmail,
        notifyCustomerReportReadySms: parsed.reportReadySms,
        notifyCustomerQuoteSentEmail: parsed.quoteSentEmail,
        notifyCustomerQuoteSentSms: parsed.quoteSentSms,
        notifyCustomerVisitScheduledEmail: parsed.visitScheduledEmail,
        notifyCustomerVisitScheduledSms: parsed.visitScheduledSms,
      },
    });

    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateCustomerNotificationSettings", error);
    return { ok: false, error: "Could not save notification settings." };
  }
}
