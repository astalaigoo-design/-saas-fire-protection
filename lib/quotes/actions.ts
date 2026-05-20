"use server";

import { QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type QuoteLineItemsActionResult = { ok: true } | { ok: false; error: string };

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
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quote update." };
  }

  const quote = await prisma.quote.findFirst({
    where: {
      id: parsed.data.quoteId,
      companyId: session.companyId,
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

  const totalCents = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );

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
      data: { totalCents },
    }),
  ]);

  revalidatePath("/dashboard/reports");
  return { ok: true };
}
