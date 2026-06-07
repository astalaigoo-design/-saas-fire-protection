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
import { PilotReadinessChecklist } from "@/components/dashboard/pilot-readiness-checklist";
import { CustomerNotificationsSettingsSection } from "@/components/dashboard/customer-notifications-settings-section";
import { TechnicianAlertsSettingsSection } from "@/components/dashboard/technician-alerts-settings-section";
import { TeamInviteSection } from "@/components/dashboard/team-invite-section";
import { RepairQuotesSettingsSection } from "@/components/dashboard/repair-quotes-settings-section";
import { IntegrationsSettingsSection } from "@/components/dashboard/integrations-settings-section";
import { getIntegrationsSettingsData } from "@/lib/integrations/queries";
import { listBranchesForCompany, type BranchListItem } from "@/lib/branches/queries";
import { ensureCanAccessOrgSettings } from "@/lib/auth/guards";
import { getInspectionTypePacksData } from "@/lib/companies/inspection-type-queries";
import { getChecklistTemplatesEditorData } from "@/lib/inspections/checklist-template-queries";
import { JurisdictionsSettingsSection } from "@/components/dashboard/jurisdictions-settings-section";
import { getCompanyProfile } from "@/lib/companies/queries";
import { getCustomerNotificationSettings } from "@/lib/notifications/customer-settings";
import { getJurisdictionsSettingsData } from "@/lib/jurisdictions/queries";
import { isOwner } from "@/lib/auth/permissions";
import { getMarketConfig } from "@/lib/market/operating-market";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getPilotReadinessStatus } from "@/lib/pilot-readiness/status";
import { getOutboundEmailStatus } from "@/lib/email/env";
import { getSmsConfigStatus } from "@/lib/sms/env";
import { getTeamManagementData } from "@/lib/team/queries";

export const dynamic = "force-dynamic";

async function branchesForTeamSection(
  companyId: string,
  teamScope: Awaited<ReturnType<typeof getTeamManagementData>>["scope"],
  ownerView: boolean,
): Promise<BranchListItem[]> {
  const branches = await listBranchesForCompany(companyId);
  if (ownerView) return branches;
  if (teamScope.mode !== "branch") return [];
  return branches.filter((branch) => branch.id === teamScope.branchId);
}

export default async function OrgSettingsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanAccessOrgSettings(session.role);

  const ownerView = isOwner(session.role);

  const [
    company,
    team,
    inspectionTypePacks,
    checklistTemplates,
    integrations,
    jurisdictions,
    pilotReadiness,
    customerNotifications,
  ] = await Promise.all([
    ownerView ? getCompanyProfile(session) : Promise.resolve(null),
    getTeamManagementData(session),
    ownerView ? getInspectionTypePacksData(session) : Promise.resolve(null),
    getChecklistTemplatesEditorData(session),
    ownerView ? getIntegrationsSettingsData(session.companyId) : Promise.resolve(null),
    ownerView ? getJurisdictionsSettingsData(session) : Promise.resolve(null),
    ownerView ? getPilotReadinessStatus() : Promise.resolve(null),
    ownerView ? getCustomerNotificationSettings(session.companyId) : Promise.resolve(null),
  ]);

  const teamBranches = await branchesForTeamSection(session.companyId, team.scope, ownerView);
  const marketConfig = getMarketConfig(session.operatingMarket);
  const branchName =
    team.scope.mode === "branch"
      ? (teamBranches[0]?.name ?? "your branch")
      : null;

  return (
    <div className="space-y-10">
      <PageHeader
        title={ownerView ? "Organization" : "Branch settings"}
        description={
          ownerView
            ? "Manage branches, reassign team members and customers between locations, and configure company details."
            : `Manage technicians and checklist templates for ${branchName ?? "your branch"}. Billing, API keys, and company-wide settings are owner-only.`
        }
      />

      {ownerView && pilotReadiness && !pilotReadiness.ready ? (
        <PilotReadinessChecklist status={pilotReadiness} />
      ) : null}

      {ownerView ? <BranchesSettingsSection branches={teamBranches} /> : null}

      {ownerView ? <OutboundEmailSettingsSection status={getOutboundEmailStatus()} /> : null}

      {ownerView ? <RepairQuotesSettingsSection /> : null}

      {ownerView ? (
        <TechnicianAlertsSettingsSection
          emailStatus={getOutboundEmailStatus()}
          smsStatus={getSmsConfigStatus()}
        />
      ) : null}

      {ownerView && customerNotifications ? (
        <CustomerNotificationsSettingsSection
          settings={customerNotifications}
          emailStatus={getOutboundEmailStatus()}
          smsStatus={getSmsConfigStatus()}
        />
      ) : null}

      <TeamInviteSection
        members={team.members}
        pendingInvites={team.pendingInvites}
        branches={teamBranches}
        outboundEmailConfigured={getOutboundEmailStatus().configured}
        teamScope={team.scope}
      />

      {ownerView && inspectionTypePacks ? (
        <InspectionTypePacksSection
          packs={inspectionTypePacks.packs}
          heading={marketConfig.checklistPackHeading}
          description={marketConfig.checklistPackDescription}
        />
      ) : null}

      <ChecklistTemplatesSection
        data={checklistTemplates}
        resetLabel={marketConfig.checklistResetLabel}
        templatesDescription={`Customize checklist items per inspection type. ${marketConfig.complianceFrameworkLabel} citation packs are the starting point — add jurisdiction-specific lines, hide what you do not use, and reorder for your forms. New jobs copy the template at schedule time; jobs already in the field are unchanged.`}
      />

      {ownerView ? (
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
      ) : null}

      {ownerView && integrations ? <IntegrationsSettingsSection data={integrations} /> : null}

      {ownerView && jurisdictions ? (
        <JurisdictionsSettingsSection
          jurisdictions={jurisdictions.jurisdictions}
          certificateNumberPrefix={jurisdictions.certificateNumberPrefix}
          nextCertificateNumber={jurisdictions.nextCertificateNumber}
          operatingMarket={session.operatingMarket}
        />
      ) : null}

      {ownerView && company ? <CompanySettingsForm company={company} /> : null}
    </div>
  );
}
