import { createReportShareToken } from "@/lib/reports/share-token";
import { prisma } from "@/lib/prisma";

/** Ensures a quote has a share token; returns the token string. */
export async function ensureQuoteShareToken(quoteId: string): Promise<string> {
  const existing = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { shareToken: true },
  });
  if (existing?.shareToken) return existing.shareToken;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareToken = createReportShareToken();
    try {
      const updated = await prisma.quote.update({
        where: { id: quoteId },
        data: { shareToken },
        select: { shareToken: true },
      });
      return updated.shareToken!;
    } catch {
      /* collision — retry */
    }
  }

  throw new Error("Could not assign a quote share token.");
}
