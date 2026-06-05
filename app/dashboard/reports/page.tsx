import Link from "next/link";

import { redirect } from "next/navigation";

import { DownloadReportButton } from "@/components/inspect/download-report-button";

import { PageHeader } from "@/components/dashboard/page-header";

import { ReportShareLink } from "@/components/reports/report-share-link";

import { ReportsRegistersSection } from "@/components/reports/reports-registers-section";
import { CompliancePdfScopeNotice } from "@/components/reports/compliance-pdf-scope-notice";

import { Card, CardContent } from "@/components/ui/card";

import { EmptyState } from "@/components/ui/empty-state";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { ensureCanManageJobs } from "@/lib/auth/guards";

import { buildingLabel } from "@/lib/customers/format";

import { formatDate } from "@/lib/dashboard/dates";

import { listCompanyReportsSafe } from "@/lib/dashboard/queries";

import { OutboundEmailInlineNotice } from "@/components/dashboard/outbound-email-inline-notice";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getOutboundChannelsStatus } from "@/lib/outbound/channels";
import {
  REPORT_TEMPLATE_LABELS,
  isReportTemplateKey,
} from "@/lib/reports/templates/types";



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

    <div className="space-y-8">

      <PageHeader

        title="Reports"

        description="Compliance inspection PDFs with NFPA layouts, AHJ metadata, and company registers."

        actions={

          <Link

            href="/dashboard/quotes"

            className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}

          >

            Repair quotes

          </Link>

        }

      />



      <CompliancePdfScopeNotice variant="inline" />

      <OutboundEmailInlineNotice channels={getOutboundChannelsStatus()} context="reports" />



      <ReportsRegistersSection />



      <section className="space-y-4" aria-labelledby="compliance-reports-heading">

        <div className="space-y-1">

          <h2 id="compliance-reports-heading" className="font-heading text-lg font-semibold text-foreground">

            Compliance PDFs

          </h2>

          <p className="text-sm text-muted-foreground">

            Finalized inspection reports for customers. Generate a PDF from a completed inspection on a

            building page.

          </p>

        </div>



        {reports.length === 0 ? (

          <EmptyState

            title="No compliance PDFs yet"

            description="Complete an inspection and generate a report from the building page."

          />

        ) : (

          <ul className="space-y-3">

            {reports.map((report) => {
              const templateLabel =
                report.reportTemplateKey && isReportTemplateKey(report.reportTemplateKey)
                  ? REPORT_TEMPLATE_LABELS[report.reportTemplateKey]
                  : REPORT_TEMPLATE_LABELS.default;

              return (
              <li key={report.id}>

                <Card>

                  <CardContent className="pt-6">

                    <p className="font-medium text-foreground">

                      {report.title ?? `${report.inspection.inspectionType.name} report`}

                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">

                      {buildingLabel(report.inspection.building)} ·{" "}

                      {report.inspection.building.customer.name}

                    </p>

                    <p className="mt-2 text-xs capitalize text-muted-foreground">

                      {report.status.replace(/_/g, " ")}

                      {report.certificateNumber ? ` · ${report.certificateNumber}` : ""}

                      {` · ${templateLabel}`}

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
              );
            })}

          </ul>

        )}

      </section>

    </div>

  );

}

