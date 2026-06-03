import { redirect } from "next/navigation";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { requireWritableTenant } from "@/lib/billing/guards";
import { tryScheduleReinspectionAfterQuoteAccept } from "@/lib/quotes/accept-quote-schedule";
import { dashboardReportsUrl } from "@/lib/quotes/dashboard-quote-urls";
import { getDashboardSession } from "@/lib/dashboard/session";
import type { CalendarMonth } from "@/lib/scheduling/calendar";

type ScheduleFollowUpPageProps = {
  params: { quoteId: string };
};

export default async function ScheduleFollowUpFromQuotePage({
  params,
}: ScheduleFollowUpPageProps) {
  const session = await getDashboardSession();
  if (!session) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(`/dashboard/quotes/${params.quoteId}/schedule-follow-up`)}`,
    );
  }

  try {
    ensureCanManageJobs(session.role);
  } catch {
    redirect(`${dashboardReportsUrl(params.quoteId)}&error=permission`);
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) {
    redirect(`${dashboardReportsUrl(params.quoteId)}&error=billing`);
  }

  const result = await tryScheduleReinspectionAfterQuoteAccept({
    companyId: session.companyId,
    actorUserId: session.appUserId,
    quoteId: params.quoteId,
  });

  if (!result.scheduled) {
    const reason = encodeURIComponent(result.reason);
    redirect(`${dashboardReportsUrl(params.quoteId)}&error=${reason}`);
  }

  const redirectMonth: CalendarMonth = {
    year: result.scheduledAt.getFullYear(),
    month: result.scheduledAt.getMonth() + 1,
  };

  redirect(
    `/dashboard/jobs?year=${redirectMonth.year}&month=${redirectMonth.month}&scheduled=1&fromQuote=${params.quoteId}`,
  );
}
