import Link from "next/link";
import { redirect } from "next/navigation";
import { ScheduleImportForm } from "@/components/scheduling/schedule-import-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { listBranchesForCompany } from "@/lib/branches/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function ScheduleImportPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const branches = await listBranchesForCompany(session.companyId);
  const branchHint =
    branches.length > 1
      ? branches.map((b) => b.name).join(", ")
      : branches[0]?.name ?? "Main";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import schedule"
        description="Upload a CSV to schedule dozens of visits at once — building, type, date, and optional technician per row."
        actions={
          <Link
            href="/dashboard/jobs"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-5")}
          >
            Calendar
          </Link>
        }
      />
      <ScheduleImportForm branchHint={branchHint} />
    </div>
  );
}
