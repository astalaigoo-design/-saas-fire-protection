import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { InspectionStatusBadge } from "@/components/customers/inspection-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { formatDateTime } from "@/lib/dashboard/dates";
import { listInspections } from "@/lib/dashboard/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function InspectionsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const inspections = await listInspections(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        description="Scheduled and completed visits across your company."
      />

      {inspections.length === 0 ? (
        <EmptyState
          title="No inspections yet"
          description="Schedule a visit from the calendar to get started."
        />
      ) : (
        <ul className="space-y-3">
          {inspections.map((inspection) => (
            <li key={inspection.id}>
              <Link
                href={
                  inspection.status === "completed"
                    ? `/inspect/${inspection.id}`
                    : `/dashboard/jobs`
                }
                className="block rounded-xl transition-opacity hover:opacity-95"
              >
                <Card>
                  <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {buildingLabel(inspection.building)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {inspection.building.customer.name} · {inspection.inspectionType.name}
                        {inspection.assignedTo?.name
                          ? ` · ${inspection.assignedTo.name}`
                          : ""}
                      </p>
                      <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                        {formatDateTime(inspection.completedAt ?? inspection.scheduledAt)}
                      </p>
                    </div>
                    <InspectionStatusBadge status={inspection.status} />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
