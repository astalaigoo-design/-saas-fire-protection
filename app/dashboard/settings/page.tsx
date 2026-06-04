import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanySettingsForm } from "@/components/dashboard/company-settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChecklistTemplatesSection } from "@/components/dashboard/checklist-templates-section";
import { InspectionTypePacksSection } from "@/components/dashboard/inspection-type-packs-section";
import { BranchesSettingsSection } from "@/components/dashboard/branches-settings-section";
import { OutboundEmailSettingsSection } from "@/components/dashboard/outbound-email-settings-section";
import { TechnicianAlertsSettingsSection } from "@/components/dashboard/technician-alerts-settings-section";
import { TeamInviteSection } from "@/components/dashboard/team-invite-section";
import { listBranchesForCompany } from "@/lib/branches/queries";
import { ensureCanManageOrgSettings } from "@/lib/auth/guards";
import { getInspectionTypePacksData } from "@/lib/companies/inspection-type-queries";
import { getChecklistTemplatesEditorData } from "@/lib/inspections/checklist-template-queries";
import { getCompanyProfile } from "@/lib/companies/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getOutboundEmailStatus } from "@/lib/email/env";
import { getSmsConfigStatus } from "@/lib/sms/env";
import { getTeamManagementData } from "@/lib/team/queries";

export default async function OrgSettingsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageOrgSettings(session.role);

  const [company, team, inspectionTypePacks, checklistTemplates, branches] =
    await Promise.all([
      getCompanyProfile(session),
      getTeamManagementData(session),
      getInspectionTypePacksData(session),
      getChecklistTemplatesEditorData(session),
      listBranchesForCompany(session.companyId),
    ]);
  if (!company) redirect("/dashboard");

  return (
    <div className="space-y-10">
      <PageHeader
        title="Organization"
        description="Manage branches, reassign team members and customers between locations, and configure company details."
      />

      <BranchesSettingsSection branches={branches} />

      <OutboundEmailSettingsSection status={getOutboundEmailStatus()} />

      <TechnicianAlertsSettingsSection
        emailStatus={getOutboundEmailStatus()}
        smsStatus={getSmsConfigStatus()}
      />

      <TeamInviteSection
        members={team.members}
        pendingInvites={team.pendingInvites}
        branches={branches}
        outboundEmailConfigured={getOutboundEmailStatus().configured}
      />

      <InspectionTypePacksSection packs={inspectionTypePacks.packs} />

      <ChecklistTemplatesSection data={checklistTemplates} />

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
    </div>
  );
}
