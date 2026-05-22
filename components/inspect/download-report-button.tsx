"use client";

import { useState } from "react";
import { downloadComplianceReport } from "@/lib/reports/download-report-client";

type DownloadReportButtonProps = {
  inspectionId: string;
  variant?: "inspect" | "dashboard";
};

export function DownloadReportButton({
  inspectionId,
  variant = "inspect",
}: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    setLoading(true);
    const message = await downloadComplianceReport(inspectionId);
    if (message) setError(message);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        className={
          variant === "dashboard"
            ? "inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            : "flex min-h-12 w-full items-center justify-center rounded-xl border border-amber-500/50 bg-amber-500/10 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-60"
        }
      >
        {loading ? "Generating PDF…" : "Download compliance PDF"}
      </button>
      {error ? (
        <p role="alert" className="text-center text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
