import { redirect } from "next/navigation";
import { CommandCenterView } from "@/components/operations/command-center-view";
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

  const [snapshot, auditLog, automation] = await Promise.all([
    getCommandCenterSnapshot(session),
    listAuditEvents(session, {
      action: actionFilter || undefined,
      entityType: entityFilter || undefined,
      limit: 40,
    }),
    getAutomationVisibility(session.companyId),
  ]);

  return (
    <CommandCenterView
      snapshot={snapshot}
      auditLog={auditLog}
      auditFilters={{ action: actionFilter, entityType: entityFilter }}
      automation={automation}
    />
  );
}
