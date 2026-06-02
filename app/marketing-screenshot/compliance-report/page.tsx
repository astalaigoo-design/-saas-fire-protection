import type { Metadata } from "next";
import { PublicCompanyHeader } from "@/components/public/public-company-header";
import { formatDate } from "@/lib/dashboard/dates";
import { marketingPublicReportPreview } from "@/lib/marketing/preview-data";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Marketing preview — compliance report",
};

export default function MarketingComplianceReportPage() {
  const meta = marketingPublicReportPreview;

  return (
    <main className="min-h-[720px] bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
        <PublicCompanyHeader branding={meta.branding} />

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
          <span className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-500 text-base font-semibold text-slate-950">
            View compliance PDF
          </span>
        </div>
      </div>
    </main>
  );
}
