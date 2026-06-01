import { InspectionStatus, QuoteStatus } from "@prisma/client";
import { buildInspectionChecklistItems } from "@/lib/inspections/build-checklist";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { prisma } from "@/lib/prisma";

export type QuoteVisitKind = "repair" | "reinspection";

export const REPAIR_VISIT_DAYS = 7;
export const REINSPECTION_DAYS = 14;

const CONFLICT_WINDOW_DAYS = 3;

export type ScheduleFromAcceptedQuoteResult =
  | { ok: true; inspectionId: string; scheduledAt: Date; visitKind: QuoteVisitKind }
  | { ok: false; error: string };

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(9, 0, 0, 0);
  return next;
}

function visitLabel(kind: QuoteVisitKind): string {
  return kind === "repair" ? "Repair visit" : "Re-inspection";
}

function daysForVisit(kind: QuoteVisitKind): number {
  return kind === "repair" ? REPAIR_VISIT_DAYS : REINSPECTION_DAYS;
}

export async function scheduleJobFromAcceptedQuote(input: {
  companyId: string;
  actorUserId: string | null;
  quoteId: string;
  visitKind: QuoteVisitKind;
}): Promise<ScheduleFromAcceptedQuoteResult> {
  const quote = await prisma.quote.findFirst({
    where: { id: input.quoteId, companyId: input.companyId },
    select: {
      id: true,
      status: true,
      title: true,
      acceptedAt: true,
      scheduledInspectionId: true,
      inspection: {
        select: {
          id: true,
          buildingId: true,
          inspectionTypeId: true,
          assignedToUserId: true,
          completedAt: true,
          inspectionType: { select: { code: true, name: true } },
          building: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              customer: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!quote) {
    return { ok: false, error: "Quote not found." };
  }
  if (quote.status !== QuoteStatus.accepted) {
    return { ok: false, error: "Schedule a job only after the quote is accepted." };
  }
  if (quote.scheduledInspectionId) {
    return { ok: false, error: "A job is already scheduled for this quote." };
  }

  const source = quote.inspection;
  const anchor = quote.acceptedAt ?? new Date();
  const scheduledAt = addDays(anchor, daysForVisit(input.visitKind));
  const conflictEnd = addDays(scheduledAt, CONFLICT_WINDOW_DAYS);

  const conflicting = await prisma.inspection.findFirst({
    where: {
      companyId: input.companyId,
      buildingId: source.buildingId,
      id: { not: source.id },
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      scheduledAt: {
        gte: addDays(scheduledAt, -CONFLICT_WINDOW_DAYS),
        lte: conflictEnd,
      },
    },
    select: { id: true },
  });

  if (conflicting) {
    return {
      ok: false,
      error: "An inspection is already scheduled for this building around that date.",
    };
  }

  const quoteTitle =
    quote.title ?? `${source.inspectionType.name} repair quote`;
  const completedLabel = source.completedAt
    ? source.completedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const notes = [
    `${visitLabel(input.visitKind)} from accepted quote “${quoteTitle}”.`,
    completedLabel ? `Original inspection completed ${completedLabel}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const checklistItems = buildInspectionChecklistItems(source.inspectionType.code);

  const created = await prisma.$transaction(async (tx) => {
    const inspection = await tx.inspection.create({
      data: {
        companyId: input.companyId,
        buildingId: source.buildingId,
        inspectionTypeId: source.inspectionTypeId,
        assignedToUserId: source.assignedToUserId,
        scheduledAt,
        notes,
        items: { create: checklistItems },
      },
      select: { id: true },
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: { scheduledInspectionId: inspection.id },
    });

    return inspection;
  });

  await syncBuildingComplianceStatus(source.buildingId);

  await writeAuditEvent({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    action: "inspection.scheduled_from_quote",
    entityType: "inspection",
    entityId: created.id,
    metadata: {
      quoteId: quote.id,
      sourceInspectionId: source.id,
      visitKind: input.visitKind,
      scheduledAt: scheduledAt.toISOString(),
      daysOut: daysForVisit(input.visitKind),
    },
  });

  return {
    ok: true,
    inspectionId: created.id,
    scheduledAt,
    visitKind: input.visitKind,
  };
}
