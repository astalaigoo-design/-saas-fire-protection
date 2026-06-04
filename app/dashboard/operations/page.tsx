import { redirect } from "next/navigation";
import {
  CommandCenterView,
  type CommandCenterTab,
} from "@/components/operations/command-center-view";
import { listAssignableStaff } from "@/lib/deficiencies/queries";
import { listCompanyQuotesSafe } from "@/lib/dashboard/queries";
import { computeQuotePipelineMetrics } from "@/lib/quotes/pipeline";
import { listAuditEvents } from "@/lib/audit/queries";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getAutomationVisibility } from "@/lib/operations/automation-visibility";
import { getCommandCenterSnapshot } from "@/lib/operations/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type CommandCenterPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function firstQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export default async function CommandCenterPage({ searchParams }: CommandCenterPageProps) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const actionFilter = firstQueryValue(searchParams.action);
  const entityFilter = firstQueryValue(searchParams.entity);
  const tabParam = firstQueryValue(searchParams.tab);
  const defaultTab: CommandCenterTab =
    tabParam === "equipment" ||
    tabParam === "deficiencies" ||
    tabParam === "quotes" ||
    tabParam === "activity" ||
    tabParam === "overview"
      ? tabParam
      : "overview";

  const [snapshot, auditLog, automation, assignableStaff, quoteList] = await Promise.all([
    getCommandCenterSnapshot(session),
    listAuditEvents(session, {
      action: actionFilter || undefined,
      entityType: entityFilter || undefined,
      limit: 40,
    }),
    getAutomationVisibility(session.companyId),
    listAssignableStaff(session),
    listCompanyQuotesSafe(session),
  ]);

  const quotePipeline = computeQuotePipelineMetrics(quoteList.quotes);

  return (
    <CommandCenterView
      snapshot={snapshot}
      auditLog={auditLog}
      auditFilters={{ action: actionFilter, entityType: entityFilter }}
      automation={automation}
      assignableStaff={assignableStaff}
      quotePipeline={quotePipeline}
      defaultTab={defaultTab}
    />
  );
}
