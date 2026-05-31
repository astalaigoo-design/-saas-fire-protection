import { redirect } from "next/navigation";
import { CommandCenterView } from "@/components/operations/command-center-view";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getCommandCenterSnapshot } from "@/lib/operations/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function CommandCenterPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const snapshot = await getCommandCenterSnapshot(session);

  return <CommandCenterView snapshot={snapshot} />;
}
