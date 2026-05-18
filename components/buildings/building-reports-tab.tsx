import Link from "next/link";
import type { BuildingInspectionRow } from "@/lib/buildings/queries";
import { formatDate } from "@/lib/dashboard/dates";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BuildingReportsTabProps = {
  inspections: BuildingInspectionRow[];
};

type ReportRow = {
  id: string;
  title: string | null;
  status: string;
  generatedAt: Date | null;
  inspectionId: string;
  inspectionLabel: string;
  downloadHref: string;
};

function collectReports(inspections: BuildingInspectionRow[]): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const inspection of inspections) {
    for (const report of inspection.reports) {
      rows.push({
        id: report.id,
        title: report.title,
        status: report.status,
        generatedAt: report.generatedAt,
        inspectionId: inspection.id,
        inspectionLabel: inspection.inspectionType.name,
        downloadHref:
          report.storageUrl.startsWith("/") || report.storageUrl.startsWith("http")
            ? report.storageUrl
            : `/api/inspections/${inspection.id}/report`,
      });
    }
    if (
      inspection.status === "completed" &&
      inspection.reports.length === 0
    ) {
      rows.push({
        id: `generate-${inspection.id}`,
        title: null,
        status: "available",
        generatedAt: inspection.completedAt,
        inspectionId: inspection.id,
        inspectionLabel: inspection.inspectionType.name,
        downloadHref: `/api/inspections/${inspection.id}/report`,
      });
    }
  }
  return rows.sort(
    (a, b) =>
      (b.generatedAt?.getTime() ?? 0) - (a.generatedAt?.getTime() ?? 0),
  );
}

export function BuildingReportsTab({ inspections }: BuildingReportsTabProps) {
  const reports = collectReports(inspections);

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reports yet"
        description="PDF reports appear after inspections are completed."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id}>
          <Card>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {report.title ?? `Compliance — ${report.inspectionLabel}`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.generatedAt ? formatDate(report.generatedAt) : "On demand"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {report.status.replace("_", " ")}
                </Badge>
                <Link
                  href={report.downloadHref}
                  className={cn(buttonVariants({ size: "sm" }), "min-h-10")}
                  download
                >
                  Download PDF
                </Link>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
