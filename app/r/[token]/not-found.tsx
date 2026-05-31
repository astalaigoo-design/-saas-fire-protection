import Link from "next/link";

export default function PublicReportNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-50">
      <h1 className="text-xl font-semibold text-white">Report not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        This link may have expired or the report is no longer available.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-slate-800 px-5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Go to GetFlareflow
      </Link>
    </main>
  );
}
