import { publicReportUrl } from "@/lib/app-url";
import { CopyReportLinkButton } from "@/components/reports/copy-report-link-button";
import { ensureReportShareToken } from "@/lib/reports/share-token";

type ReportShareLinkProps = {
  reportId: string;
  shareToken: string | null;
};

export async function ReportShareLink({ reportId, shareToken }: ReportShareLinkProps) {
  const token = shareToken ?? (await ensureReportShareToken(reportId));
  const url = publicReportUrl(token);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <CopyReportLinkButton url={url} />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-xs text-primary hover:underline"
      >
        {url}
      </a>
    </div>
  );
}
