function parseFilename(contentDisposition: string | null): string {
  if (!contentDisposition) return "compliance-report.pdf";
  const quoted = /filename="([^"]+)"/.exec(contentDisposition);
  if (quoted?.[1]) return quoted[1];
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  return "compliance-report.pdf";
}

export async function downloadComplianceReport(inspectionId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/inspections/${inspectionId}/report`, {
      method: "GET",
      credentials: "include",
    });

    const contentType = response.headers.get("Content-Type") ?? "";

    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const body = (await response.json()) as { error?: string };
        return body.error ?? "Could not generate report.";
      }
      return `Download failed (${response.status}).`;
    }

    if (!contentType.includes("application/pdf")) {
      return "Server did not return a PDF. Sign in and try again.";
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      return "Report file was empty.";
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
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Could not download report.";
  }
}
