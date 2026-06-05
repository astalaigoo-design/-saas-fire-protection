"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/dashboard/dates";
import { AutomationPanel } from "@/components/operations/automation-panel";
import { AuditLogFeed } from "@/components/operations/audit-log-feed";
import { CommandCenterDeficienciesTab } from "@/components/operations/command-center-deficiencies-tab";
import { CommandCenterEquipmentTab } from "@/components/operations/command-center-equipment-tab";
import { CommandCenterImportHealth } from "@/components/operations/command-center-import-health";
import { CommandCenterOutbound } from "@/components/operations/command-center-outbound";
import { CommandCenterPermitsSection } from "@/components/operations/command-center-permits-section";
import { CommandCenterWorkOrdersSection } from "@/components/operations/command-center-work-orders-section";
import { PilotReadinessChecklist } from "@/components/dashboard/pilot-readiness-checklist";
import type { OutboundChannelsStatus } from "@/lib/outbound/channels";
import type { PilotReadinessStatus } from "@/lib/pilot-readiness/status";
import { CommandCenterQuotesTab } from "@/components/operations/command-center-quotes-tab";
import { CommandCenterRepairPipelineTab } from "@/components/operations/command-center-repair-pipeline-tab";
import type { QuotePipelineMetrics } from "@/lib/quotes/pipeline";
import type { AuditLogPage } from "@/lib/audit/queries";
import type { AutomationVisibility } from "@/lib/operations/automation-visibility";
import type { CommandCenterSnapshot } from "@/lib/operations/queries";
import type { RepairPipelineSnapshot } from "@/lib/operations/repair-pipeline";
import type { DueInspectionRow } from "@/lib/operations/due-inspections";
import { OperationsExportButtons } from "@/components/operations/operations-export-buttons";
import { DUE_REMINDER_DAYS } from "@/lib/scheduling/recurrence-policy";
import { cn } from "@/lib/utils";

function DueStatusBadge({ status }: { status: DueInspectionRow["status"] }) {
  const styles = {
    overdue: "bg-destructive/10 text-destructive",
    due_soon: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    never_inspected: "bg-muted text-muted-foreground",
  } as const;
  const labels = {
    overdue: "Overdue",
    due_soon: "Due soon",
    never_inspected: "Not started",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

function DueInspectionList({ rows }: { rows: DueInspectionRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="All clear for this cadence"
        description="No overdue or upcoming due dates in the next two weeks."
        className="py-8"
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {rows.map((row) => (
        <li key={`${row.buildingId}-${row.inspectionTypeCode}`} className="px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/buildings/${row.buildingId}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {row.buildingLabel}
                </Link>
                <DueStatusBadge status={row.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {row.customerName} · {row.inspectionTypeName}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.status === "never_inspected"
                  ? "No completed inspection on record for this cadence."
                  : row.dueAt
                    ? row.status === "overdue"
                      ? `Was due ${formatDate(row.dueAt)}`
                      : `Due ${formatDate(row.dueAt)}`
                    : null}
                {row.lastCompletedAt ? ` · Last completed ${formatDate(row.lastCompletedAt)}` : ""}
              </p>
            </div>
            <Link
              href={
                row.scheduledInspectionId
                  ? `/inspect/${row.scheduledInspectionId}`
                  : "/dashboard/jobs/new"
              }
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              {row.scheduledInspectionId ? "Open job" : "Schedule"}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

type AssignableStaff = { id: string; name: string | null; role: string };

export type CommandCenterTab =
  | "overview"
  | "equipment"
  | "repairs"
  | "deficiencies"
  | "quotes"
  | "activity";

type CommandCenterViewProps = {
  snapshot: CommandCenterSnapshot;
  auditLog: AuditLogPage;
  auditFilters: { action: string; entityType: string };
  automation: AutomationVisibility;
  assignableStaff: AssignableStaff[];
  quotePipeline: QuotePipelineMetrics;
  outboundChannels: OutboundChannelsStatus;
  pilotReadiness: PilotReadinessStatus | null;
  cronConfigured: boolean;
  repairPipeline: RepairPipelineSnapshot;
  defaultTab: CommandCenterTab;
};

export function CommandCenterView({
  snapshot,
  auditLog,
  auditFilters,
  automation,
  assignableStaff,
  quotePipeline,
  outboundChannels,
  pilotReadiness,
  cronConfigured,
  repairPipeline,
  defaultTab,
}: CommandCenterViewProps) {
  const overdueTotal =
    snapshot.dueTotals.overdue + snapshot.dueTotals.neverInspected;
  const equipmentAttention =
    snapshot.dueAssets.totals.equipmentOverdue +
    snapshot.dueAssets.totals.equipmentDueThisMonth;
  const importAttention =
    snapshot.summary.buildingsWithoutRegister +
    snapshot.summary.assetsMissingNextDue;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command center"
        description={`Track repairs end-to-end, inspection cadences, equipment due dates, and quotes. Deficiencies move open → owned → resolved → verified (auto on pass re-inspection). Due-date emails send ${DUE_REMINDER_DAYS} days ahead.`}
        actions={
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <OperationsExportButtons />
            <Link
              href="/dashboard/jobs/new"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11")}
            >
              Schedule inspection
            </Link>
          </div>
        }
      />

      <section aria-labelledby="command-stats">
        <h2 id="command-stats" className="sr-only">
          Summary stats
        </h2>
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Inspections
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Overdue / not started" value={overdueTotal} />
            <StatCard label="Due in 14 days" value={snapshot.dueTotals.dueSoon} />
            <StatCard label="Open deficiencies" value={snapshot.summary.openDeficiencies} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Equipment register
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Equipment overdue"
              value={snapshot.summary.equipmentOverdue}
              hint="Past next service due"
            />
            <StatCard
              label="Due this month"
              value={snapshot.summary.equipmentDueThisMonth}
              hint={snapshot.dueAssets.serviceMonthLabel}
            />
            <StatCard
              label="Sites without register"
              value={snapshot.summary.buildingsWithoutRegister}
              hint="No active equipment rows"
            />
            <StatCard
              label="Assets missing due date"
              value={snapshot.summary.assetsMissingNextDue}
              hint="Won't show in due lists"
            />
            <StatCard
              label="Water system tests due"
              value={snapshot.summary.waterSystemTestsDue}
              hint="Hydrant, standpipe, sprinkler"
            />
            <StatCard
              label="Open work orders"
              value={snapshot.summary.openWorkOrders}
              hint="Repairs separate from inspections"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quotes & imports
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Permits need attention"
              value={snapshot.summary.permitsNeedAttention}
              hint="Expired, expiring, missing, or no date"
            />
            <StatCard
              label="Open quote pipeline"
              value={0}
              displayValue={
                quotePipeline.openPipelineCents > 0
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(quotePipeline.openPipelineCents / 100)
                  : "$0"
              }
              hint={`${snapshot.summary.pendingQuotes} drafts`}
            />
            <StatCard
              label="CSV imports (90 days)"
              value={snapshot.summary.csvImportsLast90Days}
              hint="Customers, buildings, equipment, schedule"
            />
            <StatCard label="Reports sent (month)" value={snapshot.summary.reportsSentThisMonth} />
          </div>
        </div>
      </section>

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="equipment">
              Equipment ({equipmentAttention})
            </TabsTrigger>
            <TabsTrigger value="repairs">
              Repair pipeline ({repairPipeline.totals.active})
            </TabsTrigger>
            <TabsTrigger value="deficiencies">
              Deficiencies ({snapshot.summary.openDeficiencies})
            </TabsTrigger>
            <TabsTrigger value="quotes">
              Quotes & reports
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6 space-y-8">
          {pilotReadiness && !pilotReadiness.ready ? (
            <PilotReadinessChecklist status={pilotReadiness} compact />
          ) : null}
          <CommandCenterOutbound channels={outboundChannels} />
          <CommandCenterImportHealth health={snapshot.importHealth} />
          <CommandCenterPermitsSection
            rows={snapshot.permits.rows}
            totals={snapshot.permits.totals}
          />
          <CommandCenterWorkOrdersSection
            workOrders={snapshot.workOrders.open}
            openCount={snapshot.workOrders.openCount}
          />

          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Buildings due & overdue
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly, quarterly, and annual cadences based on last completed visit or open
              scheduled jobs.
            </p>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            {(
              [
                ["Monthly", snapshot.dueByCadence.monthly],
                ["Quarterly", snapshot.dueByCadence.quarterly],
                ["Annual", snapshot.dueByCadence.annual],
              ] as const
            ).map(([label, rows]) => (
              <Card key={label}>
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <DueInspectionList rows={rows} />
                </CardContent>
              </Card>
            ))}
          </div>

          {equipmentAttention > 0 || importAttention > 0 ? (
            <p className="text-sm text-muted-foreground">
              {equipmentAttention > 0 ? (
                <>
                  <Link
                    href="/dashboard/operations?tab=equipment"
                    className="font-medium text-primary hover:underline"
                  >
                    {equipmentAttention} equipment item{equipmentAttention === 1 ? "" : "s"} due or
                    overdue
                  </Link>
                </>
              ) : null}
              {equipmentAttention > 0 && importAttention > 0 ? " · " : null}
              {importAttention > 0
                ? `${importAttention} register gap${importAttention === 1 ? "" : "s"} (see Data & import health above)`
                : null}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <CommandCenterEquipmentTab
            dueAssets={snapshot.dueAssets}
            importHealth={snapshot.importHealth}
          />
        </TabsContent>

        <TabsContent value="repairs" className="mt-6">
          <CommandCenterRepairPipelineTab pipeline={repairPipeline} />
        </TabsContent>

        <TabsContent value="deficiencies" className="mt-6 space-y-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Corrective actions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each failed checklist line becomes a tracked deficiency on the building. Assign an
              owner, set a due date, mark resolved when work is done, and verify on a passing
              re-inspection.
            </p>
          </div>
          <CommandCenterDeficienciesTab
            deficiencies={snapshot.deficiencies}
            assignableStaff={assignableStaff}
          />
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <CommandCenterQuotesTab
            metrics={quotePipeline}
            pendingQuotes={snapshot.pendingQuotes}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6 space-y-8">
          <AutomationPanel
            automation={automation}
            emailConfigured={outboundChannels.email.configured}
            cronConfigured={cronConfigured}
          />
          <AuditLogFeed
            key={`${auditFilters.action}|${auditFilters.entityType}`}
            initialEvents={auditLog.events}
            initialNextCursor={auditLog.nextCursor}
            initialAction={auditFilters.action}
            initialEntityType={auditFilters.entityType}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
