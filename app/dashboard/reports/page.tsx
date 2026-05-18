import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate } from "@/lib/dashboard/dates";
import { listCompanyReports } from "@/lib/dashboard/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function ReportsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const reports = await listCompanyReports(session.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generated compliance PDFs from completed inspections."
      />

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Generate a report from a completed inspection on a building page."
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id}>
              <Card>
                <CardContent>
                  <p className="font-medium text-foreground">
                    {report.title ??
                      `${report.inspection.inspectionType.name} report`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {buildingLabel(report.inspection.building)} ·{" "}
                    {report.inspection.building.customer.name}
                  </p>
                  <p className="mt-2 text-xs capitalize text-muted-foreground">
                    {report.status.replace(/_/g, " ")}
                    {report.generatedAt
                      ? ` · ${formatDate(report.generatedAt)}`
                      : ""}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
