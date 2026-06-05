"use server";

import { QuoteStatus, RepairInvoiceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { branchScopeFromSession, quoteWhereFromScope, repairInvoiceWhereFromScope } from "@/lib/branches/scope";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { sendRepairInvoiceEmail } from "@/lib/email/send-repair-invoice-email";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import { generateRepairInvoicePdf } from "@/lib/repair-invoices/generate-repair-invoice-pdf";
import {
  allocateRepairInvoiceNumber,
  defaultRepairInvoiceDueAt,
} from "@/lib/repair-invoices/invoice-number";

export type RepairInvoiceActionResult =
  | { ok: true; invoiceId: string; invoiceNumber: string }
  | { ok: false; error: string };

export type SendRepairInvoiceActionResult =
  | { ok: true; sentTo: string; invoiceNumber: string }
  | { ok: false; error: string };

export type MarkRepairInvoicePaidResult = { ok: true } | { ok: false; error: string };

const quoteIdSchema = z.object({
  quoteId: z.string().min(1),
});

const invoiceIdSchema = z.object({
  invoiceId: z.string().min(1),
});

function buildingLabelFromQuote(quote: {
  inspection: {
    building: {
      name: string | null;
      addressLine1: string;
      city: string;
    };
  };
}): string {
  const building = quote.inspection.building;
  return building.name?.trim() || `${building.addressLine1}, ${building.city}`;
}

export async function createRepairInvoiceFromQuote(
  _prev: RepairInvoiceActionResult | null,
  formData: FormData,
): Promise<RepairInvoiceActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  ensureCanManageJobs(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = quoteIdSchema.safeParse({ quoteId: formData.get("quoteId") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid quote." };
  }

  const scope = branchScopeFromSession(session);
  const quote = await prisma.quote.findFirst({
    where: {
      id: parsed.data.quoteId,
      ...quoteWhereFromScope(scope, session.companyId),
      status: QuoteStatus.accepted,
    },
    select: {
      id: true,
      currency: true,
      subtotalCents: true,
      taxRateBasisPoints: true,
      taxCents: true,
      discountCents: true,
      totalCents: true,
      repairInvoice: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!quote) {
    return { ok: false, error: "Accepted quote not found." };
  }

  if (quote.repairInvoice) {
    return {
      ok: true,
      invoiceId: quote.repairInvoice.id,
      invoiceNumber: quote.repairInvoice.invoiceNumber,
    };
  }

  try {
    const dueAt = defaultRepairInvoiceDueAt();
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await allocateRepairInvoiceNumber(tx, session.companyId);
      return tx.repairInvoice.create({
        data: {
          companyId: session.companyId,
          quoteId: quote.id,
          invoiceNumber,
          status: RepairInvoiceStatus.draft,
          currency: quote.currency,
          subtotalCents: quote.subtotalCents,
          taxRateBasisPoints: quote.taxRateBasisPoints,
          taxCents: quote.taxCents,
          discountCents: quote.discountCents,
          totalCents: quote.totalCents,
          dueAt,
        },
        select: { id: true, invoiceNumber: true },
      });
    });

    await writeAuditEvent({
      companyId: session.companyId,
      actorUserId: session.appUserId,
      action: "repair_invoice.created",
      entityType: "repair_invoice",
      entityId: invoice.id,
      metadata: { quoteId: quote.id, invoiceNumber: invoice.invoiceNumber },
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard/invoices");
    return { ok: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
  } catch (error) {
    captureServerActionError("createRepairInvoiceFromQuote", error);
    return { ok: false, error: "Could not create invoice." };
  }
}

export async function sendRepairInvoice(
  _prev: SendRepairInvoiceActionResult | null,
  formData: FormData,
): Promise<SendRepairInvoiceActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  ensureCanManageJobs(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = invoiceIdSchema.safeParse({ invoiceId: formData.get("invoiceId") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid invoice." };
  }

  const scope = branchScopeFromSession(session);
  const invoice = await prisma.repairInvoice.findFirst({
    where: {
      id: parsed.data.invoiceId,
      ...repairInvoiceWhereFromScope(scope, session.companyId),
      status: { in: [RepairInvoiceStatus.draft, RepairInvoiceStatus.sent] },
    },
    select: {
      id: true,
      invoiceNumber: true,
      currency: true,
      subtotalCents: true,
      taxCents: true,
      discountCents: true,
      totalCents: true,
      dueAt: true,
      quote: {
        select: {
          title: true,
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
      },
    },
  });

  if (!invoice) {
    return { ok: false, error: "Invoice not found or already paid." };
  }

  const customerEmail = invoice.quote.inspection.building.customer.email?.trim();
  if (!customerEmail) {
    return { ok: false, error: "Add a customer email before sending the invoice." };
  }

  let pdfBuffer: Buffer;
  let pdfFilename: string;
  try {
    const generated = await generateRepairInvoicePdf(session, invoice.id);
    pdfBuffer = generated.buffer;
    pdfFilename = generated.filename;
  } catch (error) {
    captureServerActionError("sendRepairInvoice.pdf", error);
    return { ok: false, error: "Could not generate the invoice PDF." };
  }

  const buildingLabel = buildingLabelFromQuote(invoice.quote);
  const quoteTitle =
    invoice.quote.title ?? `${invoice.quote.inspection.inspectionType.name} repair invoice`;

  const emailResult = await sendRepairInvoiceEmail({
    to: customerEmail,
    customerName: invoice.quote.inspection.building.customer.name,
    companyName: invoice.quote.inspection.company.name,
    buildingLabel,
    invoiceNumber: invoice.invoiceNumber,
    quoteTitle,
    currency: invoice.currency,
    subtotalCents: invoice.subtotalCents,
    taxCents: invoice.taxCents,
    discountCents: invoice.discountCents,
    totalCents: invoice.totalCents,
    dueAt: invoice.dueAt,
    lineItems: invoice.quote.lineItems,
    replyTo: invoice.quote.inspection.company.reportEmail,
    invoicePdfBuffer: pdfBuffer,
    invoicePdfFilename: pdfFilename,
  });

  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error };
  }

  const now = new Date();
  await prisma.repairInvoice.update({
    where: { id: invoice.id },
    data: {
      status: RepairInvoiceStatus.sent,
      sentTo: customerEmail,
      sentAt: now,
      sentMessageId: emailResult.messageId,
    },
  });

  await writeAuditEvent({
    companyId: session.companyId,
    actorUserId: session.appUserId,
    action: "repair_invoice.sent",
    entityType: "repair_invoice",
    entityId: invoice.id,
    metadata: { sentTo: customerEmail, invoiceNumber: invoice.invoiceNumber },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/invoices");
  return { ok: true, sentTo: customerEmail, invoiceNumber: invoice.invoiceNumber };
}

export async function markRepairInvoicePaid(
  _prev: MarkRepairInvoicePaidResult | null,
  formData: FormData,
): Promise<MarkRepairInvoicePaidResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  ensureCanManageJobs(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = invoiceIdSchema.safeParse({ invoiceId: formData.get("invoiceId") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid invoice." };
  }

  const scope = branchScopeFromSession(session);
  const invoice = await prisma.repairInvoice.findFirst({
    where: {
      id: parsed.data.invoiceId,
      ...repairInvoiceWhereFromScope(scope, session.companyId),
      status: { in: [RepairInvoiceStatus.draft, RepairInvoiceStatus.sent] },
    },
    select: { id: true, invoiceNumber: true },
  });

  if (!invoice) {
    return { ok: false, error: "Invoice not found or already paid." };
  }

  const now = new Date();
  await prisma.repairInvoice.update({
    where: { id: invoice.id },
    data: {
      status: RepairInvoiceStatus.paid,
      paidAt: now,
    },
  });

  await writeAuditEvent({
    companyId: session.companyId,
    actorUserId: session.appUserId,
    action: "repair_invoice.paid",
    entityType: "repair_invoice",
    entityId: invoice.id,
    metadata: { invoiceNumber: invoice.invoiceNumber },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/invoices");
  return { ok: true };
}
