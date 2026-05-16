"use client";

import { useState } from "react";

type DownloadReportButtonProps = {
  inspectionId: string;
};

function parseFilename(contentDisposition: string | null): string {
  if (!contentDisposition) return "compliance-report.pdf";
  const quoted = /filename="([^"]+)"/.exec(contentDisposition);
  if (quoted?.[1]) return quoted[1];
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  return "compliance-report.pdf";
}

export function DownloadReportButton({ inspectionId }: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/inspections/${inspectionId}/report`, {
        method: "GET",
        credentials: "include",
      });

      const contentType = response.headers.get("Content-Type") ?? "";

      if (!response.ok) {
        if (contentType.includes("application/json")) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Could not generate report.");
        }
        throw new Error(`Download failed (${response.status}).`);
      }

      if (!contentType.includes("application/pdf")) {
        throw new Error("Server did not return a PDF. Sign in and try again.");
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Report file was empty.");
      }

      const filename = parseFilename(response.headers.get("Content-Disposition"));
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : "Could not download report.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center rounded-xl border border-amber-500/50 bg-amber-500/10 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-60"
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
