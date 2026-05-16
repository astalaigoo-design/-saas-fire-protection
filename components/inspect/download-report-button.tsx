"use client";

type DownloadReportButtonProps = {
  inspectionId: string;
};

export function DownloadReportButton({ inspectionId }: DownloadReportButtonProps) {
  const href = `/api/inspections/${inspectionId}/report`;

  return (
    <a
      href={href}
      download
      className="flex min-h-12 w-full items-center justify-center rounded-xl border border-amber-500/50 bg-amber-500/10 text-sm font-semibold text-amber-400 hover:bg-amber-500/20"
    >
      Download compliance PDF
    </a>
  );
}
