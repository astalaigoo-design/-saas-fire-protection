import { publicQuoteUrl } from "@/lib/app-url";
import { CopyReportLinkButton } from "@/components/reports/copy-report-link-button";
import { ensureQuoteShareToken } from "@/lib/quotes/share-token";

type QuoteShareLinkProps = {
  quoteId: string;
  shareToken: string | null;
};

export async function QuoteShareLink({ quoteId, shareToken }: QuoteShareLinkProps) {
  const token = shareToken ?? (await ensureQuoteShareToken(quoteId));
  const url = publicQuoteUrl(token);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <CopyReportLinkButton url={url} />
      <a
        href={url}
        data-testid="public-quote-link"
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-xs text-primary hover:underline"
      >
        {url}
      </a>
    </div>
  );
}
