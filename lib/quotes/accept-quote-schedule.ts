import {
  REINSPECTION_DAYS,
  scheduleJobFromAcceptedQuote,
  type ScheduleFromAcceptedQuoteResult,
} from "@/lib/scheduling/schedule-from-accepted-quote";

export type QuoteAcceptScheduleOutcome =
  | { scheduled: true; inspectionId: string; scheduledAt: Date }
  | { scheduled: false; reason: string };

/** Best-effort re-inspection job after a quote is marked accepted. */
export async function tryScheduleReinspectionAfterQuoteAccept(input: {
  companyId: string;
  quoteId: string;
  actorUserId: string | null;
}): Promise<QuoteAcceptScheduleOutcome> {
  const result: ScheduleFromAcceptedQuoteResult = await scheduleJobFromAcceptedQuote({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    quoteId: input.quoteId,
    visitKind: "reinspection",
  });

  if (result.ok) {
    return {
      scheduled: true,
      inspectionId: result.inspectionId,
      scheduledAt: result.scheduledAt,
    };
  }

  return { scheduled: false, reason: result.error };
}

export function formatReinspectionScheduleDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export { REINSPECTION_DAYS };
