import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/dashboard/dates";
import { getPublicReportMeta } from "@/lib/reports/public-report";

type PublicReportPageProps = {
  params: { token: string };
};

export default async function PublicReportPage({ params }: PublicReportPageProps) {
  const meta = await getPublicReportMeta(params.token);
  if (!meta) notFound();

  const pdfUrl = `/api/public/reports/${meta.shareToken}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-16 sm:py-24">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Fire inspection report
          </p>
          <h1 className="text-2xl font-semibold leading-snug text-white">{meta.buildingLabel}</h1>
          <p className="text-sm text-slate-400">
            {meta.customerName} · {meta.inspectionTypeName}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
          <p className="text-sm text-slate-300">
            Completed {formatDate(meta.completedAt)} by {meta.companyName}
          </p>
          <p
            className={`mt-3 text-lg font-semibold ${
              meta.overallPass ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {meta.overallPass ? "Passed overall" : "Some items need attention"}
          </p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-500 text-base font-semibold text-slate-950 hover:bg-amber-400"
          >
            View compliance PDF
          </a>
        </div>

        <p className="text-center text-xs leading-5 text-slate-500">
          This link is read-only. For questions about repairs or scheduling, contact{" "}
          {meta.companyName} directly.
        </p>

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
