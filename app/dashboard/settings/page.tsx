import { redirect } from "next/navigation";
import { CompanySettingsForm } from "@/components/dashboard/company-settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
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
import { OrgSettingsBillingCard } from "@/components/dashboard/org-settings-billing-card";
import {
  OrgSettingsGroup,
  OrgSettingsLayout,
  type OrgSettingsNavItem,
} from "@/components/dashboard/org-settings-layout";
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

const OWNER_ORG_NAV: OrgSettingsNavItem[] = [
  { id: "company", label: "Company" },
  { id: "branches", label: "Branches" },
  { id: "billing", label: "Billing" },
  { id: "team", label: "Team" },
  { id: "outbound-email", label: "Email" },
  { id: "technician-alerts", label: "Tech alerts" },
  { id: "customer-notifications", label: "Customers" },
  { id: "inspection-type-packs", label: "Inspection packs" },
  { id: "checklist-templates", label: "Checklists" },
  { id: "jurisdictions", label: "Jurisdictions" },
  { id: "repair-quotes", label: "Repair quotes" },
  { id: "integrations", label: "Integrations" },
];

const BRANCH_ADMIN_NAV: OrgSettingsNavItem[] = [
  { id: "team", label: "Team" },
  { id: "checklist-templates", label: "Checklists" },
];

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
  const outboundEmailStatus = getOutboundEmailStatus();
  const smsStatus = getSmsConfigStatus();

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
    team.scope.mode === "branch" ? (teamBranches[0]?.name ?? "your branch") : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={ownerView ? "Organization" : "Branch settings"}
        description={
          ownerView
            ? "Company profile, team, inspections, communications, billing, and integrations — grouped below with quick jump links."
            : `Manage technicians and checklist templates for ${branchName ?? "your branch"}. Billing, API keys, and company-wide settings are owner-only.`
        }
      />

      {ownerView && pilotReadiness && !pilotReadiness.ready ? (
        <PilotReadinessChecklist status={pilotReadiness} />
      ) : null}

      <OrgSettingsLayout navItems={ownerView ? OWNER_ORG_NAV : BRANCH_ADMIN_NAV}>
        {ownerView && company ? (
          <OrgSettingsGroup
            title="Company"
            description="Identity on reports, branch structure, and subscription billing."
          >
            <CompanySettingsForm company={company} />
            <BranchesSettingsSection branches={teamBranches} />
            <OrgSettingsBillingCard />
          </OrgSettingsGroup>
        ) : null}

        <OrgSettingsGroup
          title="Team"
          description={
            ownerView
              ? "Invite admins and technicians, assign branches, and keep job-alert contact current."
              : "Invite technicians for your branch and keep mobile numbers current for SMS alerts."
          }
        >
          <TeamInviteSection
            members={team.members}
            pendingInvites={team.pendingInvites}
            branches={teamBranches}
            outboundEmailConfigured={outboundEmailStatus.configured}
            teamScope={team.scope}
          />
        </OrgSettingsGroup>

        {ownerView ? (
          <OrgSettingsGroup
            title="Communications"
            description="Operational email, technician alerts, and customer notification defaults."
          >
            <OutboundEmailSettingsSection status={outboundEmailStatus} />
            <TechnicianAlertsSettingsSection
              emailStatus={outboundEmailStatus}
              smsStatus={smsStatus}
            />
            {customerNotifications ? (
              <CustomerNotificationsSettingsSection
                settings={customerNotifications}
                emailStatus={outboundEmailStatus}
                smsStatus={smsStatus}
              />
            ) : null}
          </OrgSettingsGroup>
        ) : null}

        <OrgSettingsGroup
          title="Inspections"
          description="Enable inspection types, customize checklists, and configure jurisdiction PDFs."
        >
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

          {ownerView && jurisdictions ? (
            <JurisdictionsSettingsSection
              jurisdictions={jurisdictions.jurisdictions}
              certificateNumberPrefix={jurisdictions.certificateNumberPrefix}
              nextCertificateNumber={jurisdictions.nextCertificateNumber}
              operatingMarket={session.operatingMarket}
            />
          ) : null}
        </OrgSettingsGroup>

        {ownerView ? (
          <OrgSettingsGroup
            title="Quotes & integrations"
            description="Repair quote scope, REST API access, and outbound webhooks for CMMS or accounting tools."
          >
            <RepairQuotesSettingsSection />
            {integrations ? <IntegrationsSettingsSection data={integrations} /> : null}
          </OrgSettingsGroup>
        ) : null}
      </OrgSettingsLayout>
    </div>
  );
}
