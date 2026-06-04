import { InspectionStatus, QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { notifyQuoteCustomerResponse } from "@/lib/notifications/notify-quote-response";
import { buildingLabel } from "@/lib/customers/format";
import { sendQuoteCustomerResponseEmail } from "@/lib/email/send-quote-customer-response-email";
import {
  tryScheduleReinspectionAfterQuoteAccept,
  type QuoteAcceptScheduleOutcome,
} from "@/lib/quotes/accept-quote-schedule";
import {
  appendCustomerQuoteNote,
  formatCustomerQuoteNote,
} from "@/lib/quotes/customer-response-notes";
import { prisma } from "@/lib/prisma";

export const publicQuoteResponseSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("decline") }),
  z.object({
    action: z.literal("request_changes"),
    message: z.string().trim().min(10, "Please describe the changes you need (at least 10 characters).").max(2000),
  }),
]);

export type PublicQuoteResponseInput = z.infer<typeof publicQuoteResponseSchema>;

export type PublicQuoteRespondResult =
  | { ok: true; status: QuoteStatus; message: string }
  | { ok: false; error: string };

const respondSelect = {
  id: true,
  companyId: true,
  status: true,
  notes: true,
  title: true,
  shareToken: true,
  inspection: {
    select: {
      status: true,
      inspectionType: { select: { name: true } },
      company: { select: { name: true, reportEmail: true } },
      building: {
        select: {
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true, email: true } },
        },
      },
    },
  },
} as const;

export async function respondToPublicQuote(
  shareToken: string,
  input: PublicQuoteResponseInput,
): Promise<PublicQuoteRespondResult> {
  const quote = await prisma.quote.findFirst({
    where: {
      shareToken,
      status: QuoteStatus.sent,
      inspection: { status: InspectionStatus.completed },
    },
    select: respondSelect,
  });

  if (!quote?.shareToken) {
    return { ok: false, error: "This quote is not available for a response." };
  }

  const building = buildingLabel(quote.inspection.building);
  const quoteTitle =
    quote.title ?? `${quote.inspection.inspectionType.name} repair quote`;
  const now = new Date();

  if (input.action === "accept") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.accepted,
        acceptedAt: now,
        declinedAt: null,
        statusChangedAt: now,
      },
    });
    await writeAuditEvent({
      companyId: quote.companyId,
      action: "quote.accepted",
      entityType: "quote",
      entityId: quote.id,
      metadata: { source: "public_link", buildingLabel: building },
    });
    try {
      const { emitQuoteUpdatedWebhook } = await import("@/lib/integrations/emit");
      await emitQuoteUpdatedWebhook(quote.companyId, quote.id);
    } catch (error) {
      console.error("emitQuoteUpdatedWebhook failed", error);
    }
    const schedule = await tryScheduleReinspectionAfterQuoteAccept({
      companyId: quote.companyId,
      quoteId: quote.id,
      actorUserId: null,
    });
    await notifyCompany(quote, "accepted", {
      buildingLabel: building,
      quoteTitle,
      schedule,
    });
    await notifyQuoteCustomerResponse({
      companyId: quote.companyId,
      quoteId: quote.id,
      type: "quote.accepted",
      buildingLabel: building,
      quoteTitle,
      customerName: quote.inspection.building.customer.name,
    });
    revalidateAfterQuoteResponse(quote.shareToken);
    if (schedule.scheduled) {
      revalidatePath("/dashboard/jobs");
    }
    return {
      ok: true,
      status: QuoteStatus.accepted,
      message: "Thank you — your acceptance has been recorded.",
    };
  }

  if (input.action === "decline") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.declined,
        declinedAt: now,
        acceptedAt: null,
        statusChangedAt: now,
      },
    });
    await writeAuditEvent({
      companyId: quote.companyId,
      action: "quote.declined",
      entityType: "quote",
      entityId: quote.id,
      metadata: { source: "public_link", buildingLabel: building },
    });
    try {
      const { emitQuoteUpdatedWebhook } = await import("@/lib/integrations/emit");
      await emitQuoteUpdatedWebhook(quote.companyId, quote.id);
    } catch (error) {
      console.error("emitQuoteUpdatedWebhook failed", error);
    }
    await notifyCompany(quote, "declined", { buildingLabel: building, quoteTitle });
    revalidateAfterQuoteResponse(quote.shareToken);
    return {
      ok: true,
      status: QuoteStatus.declined,
      message: "Your response has been recorded. The contractor has been notified.",
    };
  }

  const noteBlock = formatCustomerQuoteNote("request_changes", input.message);
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      notes: appendCustomerQuoteNote(quote.notes, noteBlock),
      statusChangedAt: now,
    },
  });
  await writeAuditEvent({
    companyId: quote.companyId,
    action: "quote.changes_requested",
    entityType: "quote",
    entityId: quote.id,
    metadata: {
      source: "public_link",
      buildingLabel: building,
      messagePreview: input.message.slice(0, 200),
    },
  });
  await notifyCompany(quote, "request_changes", {
    buildingLabel: building,
    quoteTitle,
    customerMessage: input.message,
  });
  await notifyQuoteCustomerResponse({
    companyId: quote.companyId,
    quoteId: quote.id,
    type: "quote.changes_requested",
    buildingLabel: building,
    quoteTitle,
    customerName: quote.inspection.building.customer.name,
    customerMessage: input.message,
  });
  revalidateAfterQuoteResponse(quote.shareToken);
  return {
    ok: true,
    status: QuoteStatus.sent,
    message: "Your change request has been sent to the contractor.",
  };
}

function revalidateAfterQuoteResponse(shareToken: string): void {
  revalidatePath(`/q/${shareToken}`);
  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/operations");
  revalidatePath("/dashboard/operations");
}

async function notifyCompany(
  quote: {
    id: string;
    inspection: {
      company: { name: string; reportEmail: string | null };
      building: { customer: { name: string; email: string | null } };
    };
  },
  response: "accepted" | "declined" | "request_changes",
  details: {
    buildingLabel: string;
    quoteTitle: string;
    customerMessage?: string;
    schedule?: QuoteAcceptScheduleOutcome;
  },
): Promise<void> {
  const to = quote.inspection.company.reportEmail?.trim();
  if (!to) return;

  await sendQuoteCustomerResponseEmail({
    to,
    companyName: quote.inspection.company.name,
    customerName: quote.inspection.building.customer.name,
    buildingLabel: details.buildingLabel,
    quoteTitle: details.quoteTitle,
    response,
    customerMessage: details.customerMessage,
    replyTo: quote.inspection.building.customer.email,
    quoteId: response === "accepted" ? quote.id : undefined,
    schedule: details.schedule,
  });
}
