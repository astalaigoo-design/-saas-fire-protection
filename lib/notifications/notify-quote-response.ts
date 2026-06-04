import { createStaffNotification } from "@/lib/notifications/create";
import { dashboardReportsUrl } from "@/lib/quotes/dashboard-quote-urls";
import type { StaffNotificationType } from "@/lib/notifications/types";

export async function notifyQuoteCustomerResponse(input: {
  companyId: string;
  quoteId: string;
  type: Extract<
    StaffNotificationType,
    "quote.accepted" | "quote.declined" | "quote.changes_requested"
  >;
  buildingLabel: string;
  quoteTitle: string;
  customerName: string;
  customerMessage?: string;
}): Promise<void> {
  const href = dashboardReportsUrl(input.quoteId);

  let title: string;
  let body: string;

  switch (input.type) {
    case "quote.accepted":
      title = `Quote accepted — ${input.buildingLabel}`;
      body = `${input.customerName} accepted “${input.quoteTitle}”.`;
      break;
    case "quote.declined":
      title = `Quote declined — ${input.buildingLabel}`;
      body = `${input.customerName} declined “${input.quoteTitle}”.`;
      break;
    case "quote.changes_requested":
      title = `Quote changes requested — ${input.buildingLabel}`;
      body = `${input.customerName} requested changes to “${input.quoteTitle}”.${input.customerMessage ? ` ${input.customerMessage.slice(0, 280)}` : ""}`;
      break;
  }

  await createStaffNotification({
    companyId: input.companyId,
    type: input.type,
    title,
    body,
    href,
    entityType: "quote",
    entityId: input.quoteId,
    emailOwnersAndAdmins: true,
  });
}
