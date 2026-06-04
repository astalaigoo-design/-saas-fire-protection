import { InspectionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** In-app/email note when a recurring series is assigned (first date only). */
export function buildRecurringOccurrenceNote(occurrenceCount: number): string | null {
  if (occurrenceCount <= 1) return null;
  return `${occurrenceCount} recurring visits were scheduled; this alert is for the first date only.`;
}

export type RecurringAssignNotifyDecision =
  | { notify: true; occurrenceNote: string | null }
  | { notify: false };

/**
 * For assign alerts on a recurring series: only the earliest scheduled/in-progress
 * visit should notify (email/SMS/in-app). Later series dates stay on My jobs silently.
 */
async function firstScheduledSiblingId(input: {
  companyId: string;
  recurrenceGroupId: string;
}): Promise<string | null> {
  const siblings = await prisma.inspection.findMany({
    where: {
      companyId: input.companyId,
      recurrenceGroupId: input.recurrenceGroupId,
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
    },
    select: { id: true },
    orderBy: { scheduledAt: "asc" },
    take: 1,
  });
  return siblings[0]?.id ?? null;
}

export async function resolveRecurringAssignNotify(input: {
  companyId: string;
  inspectionId: string;
  /** When the scheduler already knows series size (batch create). */
  knownOccurrenceCount?: number;
}): Promise<RecurringAssignNotifyDecision> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: { id: true, recurrenceGroupId: true },
  });

  if (!inspection) return { notify: false };

  if (!inspection.recurrenceGroupId) {
    return { notify: true, occurrenceNote: null };
  }

  const firstId = await firstScheduledSiblingId({
    companyId: input.companyId,
    recurrenceGroupId: inspection.recurrenceGroupId,
  });

  if (!firstId || firstId !== inspection.id) {
    return { notify: false };
  }

  const seriesCount =
    input.knownOccurrenceCount != null && input.knownOccurrenceCount > 1
      ? input.knownOccurrenceCount
      : (
          await prisma.inspection.count({
            where: {
              companyId: input.companyId,
              recurrenceGroupId: inspection.recurrenceGroupId,
              status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
            },
          })
        );

  if (seriesCount <= 1) {
    return { notify: true, occurrenceNote: null };
  }

  return {
    notify: true,
    occurrenceNote: buildRecurringOccurrenceNote(seriesCount),
  };
}
