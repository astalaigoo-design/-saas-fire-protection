import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanySettingsForm } from "@/components/dashboard/company-settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InspectionTypePacksSection } from "@/components/dashboard/inspection-type-packs-section";
import { TeamInviteSection } from "@/components/dashboard/team-invite-section";
import { ensureCanManageOrgSettings } from "@/lib/auth/guards";
import { getInspectionTypePacksData } from "@/lib/companies/inspection-type-queries";
import { getCompanyProfile } from "@/lib/companies/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getTeamManagementData } from "@/lib/team/queries";

export default async function OrgSettingsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageOrgSettings(session.role);

  const [company, team, inspectionTypePacks] = await Promise.all([
    getCompanyProfile(session),
    getTeamManagementData(session),
    getInspectionTypePacksData(session),
  ]);
  if (!company) redirect("/dashboard");

  return (
    <div className="space-y-10">
      <PageHeader
        title="Organization"
        description="Your business name, logo, and contact details on compliance PDF reports. Report email also receives inspection due-date reminders 7 days ahead."
      />

      <section className="max-w-lg rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Billing & subscription
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View your trial, subscribe with Paddle, or manage your plan and payment method.
        </p>
        <Link
          href="/dashboard/billing"
          className={cn(buttonVariants(), "mt-4 inline-flex min-h-10")}
        >
          Open billing
        </Link>
      </section>

      <CompanySettingsForm company={company} />
      <InspectionTypePacksSection packs={inspectionTypePacks.packs} />
      <TeamInviteSection members={team.members} pendingInvites={team.pendingInvites} />
    </div>
  );
}
