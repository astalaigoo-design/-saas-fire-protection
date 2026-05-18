import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/dashboard/dates";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getMyAssignedInspections } from "@/lib/inspect/my-jobs";
import { buildingLabel } from "@/lib/customers/format";

export default async function MyJobsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "technician") redirect("/dashboard/jobs");

  const jobs = await getMyAssignedInspections(session.appUserId, session.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My jobs"
        description="Tap a job to open the mobile inspection form."
      />

      {jobs.length === 0 ? (
        <EmptyState title="No assigned inspections right now" />
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/inspect/${job.id}`} className="block rounded-xl transition-opacity hover:opacity-95">
                <Card>
                  <CardContent>
                    <span className="font-medium text-foreground">
                      {buildingLabel(job.building)}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {job.building.customer.name} · {job.inspectionType.name}
                    </span>
                    <span className="mt-2 block text-sm font-medium text-primary">
                      {formatDateTime(job.scheduledAt)}
                    </span>
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
