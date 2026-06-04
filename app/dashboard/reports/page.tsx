import Link from "next/link";
import { redirect } from "next/navigation";
import { DownloadReportButton } from "@/components/inspect/download-report-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReportShareLink } from "@/components/reports/report-share-link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { buildingLabel } from "@/lib/customers/format";
import { formatDate } from "@/lib/dashboard/dates";
import { listCompanyReportsSafe } from "@/lib/dashboard/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

type ReportsPageProps = {
  searchParams?: { quote?: string };
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  if (searchParams?.quote?.trim()) {
    redirect(`/dashboard/quotes?quote=${encodeURIComponent(searchParams.quote.trim())}`);
  }

  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const reports = await listCompanyReportsSafe(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance reports"
        description="Finalized inspection PDFs for customers. Repair quotes and pipeline metrics are on Quotes."
        actions={
          <Link
            href="/dashboard/quotes"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
          >
            Repair quotes
          </Link>
        }
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
                    {report.title ?? `${report.inspection.inspectionType.name} report`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {buildingLabel(report.inspection.building)} ·{" "}
                    {report.inspection.building.customer.name}
                  </p>
                  <p className="mt-2 text-xs capitalize text-muted-foreground">
                    {report.status.replace(/_/g, " ")}
                    {report.generatedAt ? ` · ${formatDate(report.generatedAt)}` : ""}
                    {report.emailedTo ? ` · emailed to ${report.emailedTo}` : ""}
                  </p>
                  <div className="mt-3 space-y-3">
                    <DownloadReportButton
                      inspectionId={report.inspection.id}
                      variant="dashboard"
                    />
                    <ReportShareLink reportId={report.id} shareToken={report.shareToken} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
