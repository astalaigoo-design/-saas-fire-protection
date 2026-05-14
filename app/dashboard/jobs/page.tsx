import { getAppRole } from "@/lib/auth/session";
import { ensureCanManageJobs } from "@/lib/auth/guards";

export default async function JobsPage() {
  const role = await getAppRole();
  ensureCanManageJobs(role);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Jobs</h1>
      <p className="text-slate-400">
        Owners and admins can manage all jobs here. Wire this route to your Prisma
        models and list/create/edit flows.
      </p>
    </div>
  );
}
