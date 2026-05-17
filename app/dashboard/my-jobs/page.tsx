import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/dashboard/dates";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getMyAssignedInspections } from "@/lib/inspect/my-jobs";
import { buildingLabel } from "@/lib/customers/format";

export default async function MyJobsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "technician") redirect("/dashboard/jobs");

  const jobs = await getMyAssignedInspections(session.appUserId, session.companyId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">My jobs</h1>
        <p className="mt-1 text-slate-400">Tap a job to open the mobile inspection form.</p>
      </header>

      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-500">
          No assigned inspections right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/inspect/${job.id}`}
                className="flex min-h-[4.5rem] flex-col justify-center rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 transition-colors hover:border-amber-500/40 hover:bg-slate-900"
              >
                <span className="font-medium text-white">
                  {buildingLabel(job.building)}
                </span>
                <span className="mt-1 text-sm text-slate-400">
                  {job.building.customer.name} · {job.inspectionType.name}
                </span>
                <span className="mt-2 text-sm text-amber-400/90">
                  {formatDateTime(job.scheduledAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
