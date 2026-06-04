"use server";

import { QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { requireWritableTenant } from "@/lib/billing/guards";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { getDashboardSession } from "@/lib/dashboard/session";
import { publicQuoteUrl, publicReportUrl } from "@/lib/app-url";
import { sendQuoteEmail } from "@/lib/email/send-quote-email";
import { loadComplianceReportAttachment } from "@/lib/reports/compliance-report-attachment";
import { generateQuotePdf } from "@/lib/quotes/generate-quote-pdf";
import { tryScheduleReinspectionAfterQuoteAccept } from "@/lib/quotes/accept-quote-schedule";
import { ensureQuoteShareToken } from "@/lib/quotes/share-token";
import { recalculateQuoteTotals } from "@/lib/quotes/totals";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { branchScopeFromSession, quoteWhereFromScope } from "@/lib/branches/scope";
import { prisma } from "@/lib/prisma";

export type QuoteLineItemsActionResult = { ok: true } | { ok: false; error: string };
export type SendQuoteActionResult =
  | { ok: true; sentTo: string; publicUrl: string }
  | { ok: false; error: string };

const lineItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  quantity: z.coerce.number().int().min(1).max(999),
  unitPrice: z.coerce.number().min(0).max(1_000_000),
});

const payloadSchema = z.object({
  quoteId: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1).max(200),
  taxRatePercent: z.coerce.number().min(0).max(100).optional().default(0),
  discountAmount: z.coerce.number().min(0).max(1_000_000).optional().default(0),
});

function toCents(value: number): number {
  return Math.round(value * 100);
}

export async function updateDraftQuoteLineItems(
  _prev: QuoteLineItemsActionResult,
  formData: FormData,
): Promise<QuoteLineItemsActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  ensureCanManageJobs(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const lineItemsJson = formData.get("lineItemsJson");
  let parsedJson: unknown = [];
  if (typeof lineItemsJson === "string" && lineItemsJson.trim().length > 0) {
    try {
      parsedJson = JSON.parse(lineItemsJson);
    } catch {
      return { ok: false, error: "Invalid line item payload." };
    }
  }

  const parsed = payloadSchema.safeParse({
    quoteId: formData.get("quoteId"),
    lineItems: parsedJson,
    taxRatePercent: formData.get("taxRatePercent"),
    discountAmount: formData.get("discountAmount"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quote update." };
  }

  const scope = branchScopeFromSession(session);
  const quote = await prisma.quote.findFirst({
    where: {
      id: parsed.data.quoteId,
      ...quoteWhereFromScope(scope, session.companyId),
      status: QuoteStatus.draft,
    },
    select: {
      id: true,
      lineItems: { select: { id: true } },
    },
  });
  if (!quote) {
    return { ok: false, error: "Draft quote not found." };
  }

  const existingIds = new Set(quote.lineItems.map((item) => item.id));
  const submittedIds = new Set(parsed.data.lineItems.map((item) => item.id));
  if (submittedIds.size !== quote.lineItems.length) {
    return { ok: false, error: "Line item mismatch. Refresh and try again." };
  }
  for (const id of Array.from(submittedIds)) {
    if (!existingIds.has(id)) {
      return { ok: false, error: "Line item mismatch. Refresh and try again." };
    }
  }

  const normalizedItems = parsed.data.lineItems.map((item, index) => ({
    id: item.id,
    label: item.label.trim(),
    description: item.description?.trim() || null,
    quantity: item.quantity,
    unitPriceCents: toCents(item.unitPrice),
    sortOrder: index,
  }));
  const taxRateBasisPoints = Math.round(parsed.data.taxRatePercent * 100);
  const discountCents = toCents(parsed.data.discountAmount);

  const { subtotalCents, taxCents, totalCents } = recalculateQuoteTotals({
    lineItems: normalizedItems,
    taxRateBasisPoints,
    discountCents,
  });

  await prisma.$transaction([
    ...normalizedItems.map((item) =>
      prisma.quoteLineItem.update({
        where: { id: item.id },
        data: {
          label: item.label,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          sortOrder: item.sortOrder,
        },
      }),
    ),
    prisma.quote.update({
      where: { id: quote.id },
      data: {
        subtotalCents,
        taxRateBasisPoints,
        taxCents,
        discountCents,
        totalCents,
      },
    }),
  ]);

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/reports");
  return { ok: true };
}

export async function sendDraftQuote(
  _prev: SendQuoteActionResult | null,
  formData: FormData,
): Promise<SendQuoteActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  ensureCanManageJobs(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const quoteId = formData.get("quoteId");
  if (typeof quoteId !== "string" || !quoteId.trim()) {
    return { ok: false, error: "Missing quote id." };
  }

  const sendScope = branchScopeFromSession(session);
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      ...quoteWhereFromScope(sendScope, session.companyId),
      status: QuoteStatus.draft,
    },
    select: {
      id: true,
      title: true,
      status: true,
      currency: true,
      subtotalCents: true,
      taxCents: true,
      discountCents: true,
      totalCents: true,
      lineItems: {
        orderBy: { sortOrder: "asc" },
        select: {
          label: true,
          description: true,
          quantity: true,
          unitPriceCents: true,
        },
      },
      inspection: {
        select: {
          id: true,
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
    },
  });
  if (!quote) return { ok: false, error: "Draft quote not found." };

  const customerEmail = quote.inspection.building.customer.email?.trim();
  if (!customerEmail) {
    return {
      ok: false,
      error: "Add a customer email on the customer profile before sending.",
    };
  }

  if (quote.lineItems.some((item) => item.unitPriceCents <= 0)) {
    return {
      ok: false,
      error: "Set a unit price on every line item before sending.",
    };
  }

  let pdfBuffer: Buffer;
  let pdfFilename: string;
  let shareToken: string;
  try {
    const generated = await generateQuotePdf(session, quote.id);
    pdfBuffer = generated.buffer;
    pdfFilename = generated.filename;
    shareToken = await ensureQuoteShareToken(quote.id);
  } catch (error) {
    captureServerActionError("sendDraftQuote", error);
    return { ok: false, error: "Could not generate the quote PDF." };
  }

  const publicUrl = publicQuoteUrl(shareToken);

  const complianceReport = await loadComplianceReportAttachment(
    session,
    quote.inspection.id,
  );
  const reportLink = complianceReport
    ? publicReportUrl(complianceReport.shareToken)
    : null;

  const buildingLabel =
    quote.inspection.building.name?.trim() ||
    `${quote.inspection.building.addressLine1}, ${quote.inspection.building.city}`;

  const emailResult = await sendQuoteEmail({
    to: customerEmail,
    customerName: quote.inspection.building.customer.name,
    companyName: quote.inspection.company.name,
    buildingLabel,
    inspectionTypeName: quote.inspection.inspectionType.name,
    quoteTitle: quote.title ?? `${quote.inspection.inspectionType.name} repair quote`,
    currency: quote.currency,
    subtotalCents: quote.subtotalCents,
    taxCents: quote.taxCents,
    discountCents: quote.discountCents,
    totalCents: quote.totalCents,
    lineItems: quote.lineItems,
    replyTo: quote.inspection.company.reportEmail,
    quoteLink: publicUrl,
    reportLink,
    quotePdfBuffer: pdfBuffer,
    quotePdfFilename: pdfFilename,
    reportPdfBuffer: complianceReport?.buffer,
    reportPdfFilename: complianceReport?.filename,
  });

  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error };
  }

  const now = new Date();
  if (complianceReport) {
    await prisma.report.update({
      where: { id: complianceReport.reportId },
      data: {
        emailedTo: customerEmail,
        emailedAt: now,
        emailError: null,
      },
    });
  }
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.sent,
      sentTo: customerEmail,
      sentAt: now,
      sentMessageId: emailResult.messageId,
      statusChangedAt: now,
      acceptedAt: null,
      declinedAt: null,
    },
  });

  await writeAuditEvent({
    companyId: session.companyId,
    actorUserId: session.appUserId,
    action: "quote.sent",
    entityType: "quote",
    entityId: quote.id,
    metadata: {
      sentTo: customerEmail,
      messageId: emailResult.messageId,
    },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/operations");
  return { ok: true, sentTo: customerEmail, publicUrl };
}

async function transitionQuoteStatus(
  quoteId: string,
  next: "accepted" | "declined",
) {
  const session = await getDashboardSession();
  if (!session) return;
  ensureCanManageJobs(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return;

  const transitionScope = branchScopeFromSession(session);
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      ...quoteWhereFromScope(transitionScope, session.companyId),
      status: QuoteStatus.sent,
    },
    select: { id: true },
  });
  if (!quote) return;

  const now = new Date();
  await prisma.quote.update({
    where: { id: quote.id },
    data:
      next === "accepted"
        ? {
            status: QuoteStatus.accepted,
            acceptedAt: now,
            declinedAt: null,
            statusChangedAt: now,
          }
        : {
            status: QuoteStatus.declined,
            declinedAt: now,
            acceptedAt: null,
            statusChangedAt: now,
          },
  });

  if (next === "accepted") {
    await tryScheduleReinspectionAfterQuoteAccept({
      companyId: session.companyId,
      quoteId: quote.id,
      actorUserId: session.appUserId,
    });
    revalidatePath("/dashboard/jobs");
  }

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/reports");
}

export async function markQuoteAccepted(formData: FormData): Promise<void> {
  const quoteId = formData.get("quoteId");
  if (typeof quoteId !== "string" || !quoteId.trim()) return;
  await transitionQuoteStatus(quoteId, QuoteStatus.accepted);
}

export async function markQuoteDeclined(formData: FormData): Promise<void> {
  const quoteId = formData.get("quoteId");
  if (typeof quoteId !== "string" || !quoteId.trim()) return;
  await transitionQuoteStatus(quoteId, QuoteStatus.declined);
}
