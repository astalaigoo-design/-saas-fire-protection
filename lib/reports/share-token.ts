import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function createReportShareToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Ensures a report has a share token; returns the token string. */
export async function ensureReportShareToken(reportId: string): Promise<string> {
  const existing = await prisma.report.findUnique({
    where: { id: reportId },
    select: { shareToken: true },
  });
  if (existing?.shareToken) return existing.shareToken;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareToken = createReportShareToken();
    try {
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: { shareToken },
        select: { shareToken: true },
      });
      return updated.shareToken!;
    } catch {
      /* collision — retry */
    }
  }

  throw new Error("Could not assign a report share token.");
}
