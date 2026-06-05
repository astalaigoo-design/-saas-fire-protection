import { redirect } from "next/navigation";
import { CommandCenterView } from "@/components/operations/command-center-view";
import { resolveCommandCenterTab } from "@/lib/operations/command-center-tabs";
import { listAssignableStaff } from "@/lib/deficiencies/queries";
import { listCompanyQuotesSafe } from "@/lib/dashboard/queries";
import { computeQuotePipelineMetrics } from "@/lib/quotes/pipeline";
import { listAuditEvents } from "@/lib/audit/queries";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getAutomationVisibility } from "@/lib/operations/automation-visibility";
import { getCommandCenterSnapshot } from "@/lib/operations/queries";
import { listRepairPipelineRows } from "@/lib/operations/repair-pipeline";
import { isOwner } from "@/lib/auth/permissions";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getCronSecretStatus } from "@/lib/cron/env";
import { getOutboundChannelsStatus } from "@/lib/outbound/channels";
import { getPilotReadinessStatus } from "@/lib/pilot-readiness/status";

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
  const defaultTab = resolveCommandCenterTab(firstQueryValue(searchParams.tab));

  const showPilotReadiness = isOwner(session.role);

  const [snapshot, auditLog, automation, assignableStaff, quoteList, repairPipeline, pilotReadiness] =
    await Promise.all([
      getCommandCenterSnapshot(session),
      listAuditEvents(session, {
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        limit: 40,
      }),
      getAutomationVisibility(session.companyId),
      listAssignableStaff(session),
      listCompanyQuotesSafe(session),
      listRepairPipelineRows(session),
      showPilotReadiness ? getPilotReadinessStatus() : Promise.resolve(null),
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
      outboundChannels={getOutboundChannelsStatus()}
      pilotReadiness={pilotReadiness}
      cronConfigured={getCronSecretStatus().configured}
      repairPipeline={repairPipeline}
      defaultTab={defaultTab}
    />
  );
}
