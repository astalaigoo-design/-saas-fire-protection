"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import type { CalendarMonth } from "@/lib/scheduling/calendar";
import {
  scheduleJobFromAcceptedQuote,
  type QuoteVisitKind,
} from "@/lib/scheduling/schedule-from-accepted-quote";

export type ScheduleJobFromQuoteState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const visitKindSchema = z.enum(["repair", "reinspection"]);

export async function scheduleJobFromQuoteAction(
  _prev: ScheduleJobFromQuoteState,
  formData: FormData,
): Promise<ScheduleJobFromQuoteState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  try {
    ensureCanManageJobs(session.role);
  } catch {
    return { ok: false, error: "You do not have permission to schedule jobs." };
  }

  const quoteId = String(formData.get("quoteId") ?? "").trim();
  const visitKindRaw = String(formData.get("visitKind") ?? "repair");
  const visitKindParsed = visitKindSchema.safeParse(visitKindRaw);
  if (!quoteId || !visitKindParsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const visitKind = visitKindParsed.data as QuoteVisitKind;

  try {
    const result = await scheduleJobFromAcceptedQuote({
      companyId: session.companyId,
      actorUserId: session.appUserId,
      quoteId,
      visitKind,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/operations");

    const redirectMonth: CalendarMonth = {
      year: result.scheduledAt.getFullYear(),
      month: result.scheduledAt.getMonth() + 1,
    };

    redirect(
      `/dashboard/jobs?year=${redirectMonth.year}&month=${redirectMonth.month}&scheduled=1&fromQuote=${quoteId}`,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    captureServerActionError("scheduleJobFromQuoteAction", error);
    return { ok: false, error: "Could not schedule the job. Please try again." };
  }
}
