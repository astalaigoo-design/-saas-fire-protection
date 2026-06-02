import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteStatus } from "@prisma/client";
import { PublicCompanyHeader } from "@/components/public/public-company-header";
import { PublicQuoteResponsePanel } from "@/components/quotes/public-quote-response-panel";
import { phoneTelHref } from "@/lib/companies/public-branding";
import { formatDate } from "@/lib/dashboard/dates";
import { getPublicQuoteMeta } from "@/lib/quotes/public-quote";

type PublicQuotePageProps = {
  params: { token: string };
};

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function statusLabel(status: QuoteStatus): string {
  switch (status) {
    case QuoteStatus.sent:
      return "Awaiting your response";
    case QuoteStatus.accepted:
      return "Accepted";
    case QuoteStatus.declined:
      return "Declined";
    default:
      return status;
  }
}

export default async function PublicQuotePage({ params }: PublicQuotePageProps) {
  const meta = await getPublicQuoteMeta(params.token);
  if (!meta) notFound();

  const pdfUrl = `/api/public/quotes/${meta.shareToken}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-16 sm:py-24">
        <PublicCompanyHeader branding={meta.branding} />

        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Repair quote
          </p>
          <h1 className="text-2xl font-semibold leading-snug text-white">{meta.buildingLabel}</h1>
          <p className="text-sm text-slate-400">
            {meta.customerName} · {meta.inspectionTypeName}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-center text-sm font-medium text-slate-200">{meta.quoteTitle}</p>
          <p className="mt-2 text-center text-xs text-slate-400">
            From {meta.companyName}
            {meta.sentAt ? ` · sent ${formatDate(meta.sentAt)}` : ""}
          </p>
          <p className="mt-3 text-center text-sm text-amber-300">{statusLabel(meta.status)}</p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {meta.lineItems.map((item) => (
                  <tr key={`${item.label}-${item.quantity}-${item.unitPriceCents}`} className="border-b border-slate-800/80">
                    <td className="px-3 py-2 text-slate-200">
                      <p>{item.label}</p>
                      {item.description ? (
                        <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-slate-200">
                      {formatCurrency(item.quantity * item.unitPriceCents, meta.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 space-y-1 text-sm text-slate-300">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{formatCurrency(meta.subtotalCents, meta.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Tax</dt>
              <dd>{formatCurrency(meta.taxCents, meta.currency)}</dd>
            </div>
            {meta.discountCents > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Discount</dt>
                <dd>-{formatCurrency(meta.discountCents, meta.currency)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-slate-800 pt-2 text-base font-semibold text-white">
              <dt>Total</dt>
              <dd>{formatCurrency(meta.totalCents, meta.currency)}</dd>
            </div>
          </dl>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-500 text-base font-semibold text-slate-950 hover:bg-amber-400"
          >
            View quote PDF
          </a>

          <PublicQuoteResponsePanel shareToken={meta.shareToken} status={meta.status} />
        </div>

        {meta.status === QuoteStatus.sent ? (
          <p className="text-center text-xs leading-5 text-slate-500">
            Questions?{" "}
            {meta.branding.reportPhone ? (
              <>
                Call{" "}
                <a
                  href={phoneTelHref(meta.branding.reportPhone)}
                  className="text-amber-500/80 hover:text-amber-400"
                >
                  {meta.branding.reportPhone}
                </a>
                {meta.branding.reportEmail ? " or email " : null}
              </>
            ) : null}
            {meta.branding.reportEmail ? (
              <a
                href={`mailto:${meta.branding.reportEmail}`}
                className="text-amber-500/80 hover:text-amber-400"
              >
                {meta.branding.reportEmail}
              </a>
            ) : !meta.branding.reportPhone ? (
              meta.companyName
            ) : null}
            .
          </p>
        ) : (
          <p className="text-center text-xs leading-5 text-slate-500">
            This quote is closed. Contact{" "}
            {meta.branding.reportPhone ? (
              <a
                href={phoneTelHref(meta.branding.reportPhone)}
                className="text-amber-500/80 hover:text-amber-400"
              >
                {meta.branding.reportPhone}
              </a>
            ) : meta.branding.reportEmail ? (
              <a
                href={`mailto:${meta.branding.reportEmail}`}
                className="text-amber-500/80 hover:text-amber-400"
              >
                {meta.branding.reportEmail}
              </a>
            ) : (
              meta.companyName
            )}{" "}
            if you need anything else.
          </p>
        )}

        <p className="text-center text-xs text-slate-600">
          Powered by{" "}
          <Link href="/" className="text-amber-500/80 hover:text-amber-400">
            GetFlareflow
          </Link>
        </p>
      </div>
    </main>
  );
}
