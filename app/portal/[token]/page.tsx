import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicCompanyHeader } from "@/components/public/public-company-header";
import { phoneTelHref } from "@/lib/companies/public-branding";
import { publicReportUrl } from "@/lib/app-url";
import { formatDate } from "@/lib/dashboard/dates";
import { getPublicCustomerPortalMeta } from "@/lib/customers/public-portal";

type CustomerPortalPageProps = {
  params: { token: string };
};

export default async function CustomerPortalPage({ params }: CustomerPortalPageProps) {
  const meta = await getPublicCustomerPortalMeta(params.token);
  if (!meta) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 sm:py-24">
        <PublicCompanyHeader branding={meta.branding} />

        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Customer portal
          </p>
          <h1 className="text-2xl font-semibold text-white">{meta.customerName}</h1>
          <p className="text-sm text-slate-400">
            Compliance reports from {meta.companyName}
          </p>
        </div>

        {meta.buildings.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
            No buildings on file yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {meta.buildings.map((building) => (
              <li
                key={building.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <h2 className="text-lg font-semibold text-white">{building.label}</h2>
                {building.reports.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No finalized reports yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {building.reports.map((report) => (
                      <li key={report.shareToken}>
                        <p className="text-sm text-slate-300">{report.title}</p>
                        <p className="text-xs text-slate-500">
                          {report.inspectionTypeName} · Completed {formatDate(report.completedAt)}
                        </p>
                        <a
                          href={publicReportUrl(report.shareToken)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-amber-400 hover:text-amber-300"
                        >
                          View PDF →
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="text-center text-xs leading-5 text-slate-500">
          Read-only access. For scheduling or billing questions, contact{" "}
          {meta.branding.reportPhone ? (
            <a
              href={phoneTelHref(meta.branding.reportPhone)}
              className="text-amber-500/80 hover:text-amber-400"
            >
              {meta.branding.reportPhone}
            </a>
          ) : (
            meta.companyName
          )}
          .
        </p>

        <p className="text-center text-xs text-slate-600">
          Powered by{" "}
          <Link href="/" className="text-slate-500 hover:text-slate-400">
            FlareFlow
          </Link>
        </p>
      </div>
    </main>
  );
}
