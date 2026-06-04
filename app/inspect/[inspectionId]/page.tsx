import { notFound, redirect } from "next/navigation";
import { InspectionFormShell } from "@/components/inspect/inspection-form-shell";
import { getCompanyBillingSnapshot } from "@/lib/billing/queries";
import { getInspectSession } from "@/lib/inspect/access";
import { serializeInspectionForClient } from "@/lib/inspect/serialize-for-client";
import { getPreJobBriefForInspection, serializePreJobBrief } from "@/lib/inspect/pre-job-brief";
import { getInspectionForForm } from "@/lib/inspect/queries";
import { markJobAlertsReadForInspection } from "@/lib/notifications/mark-job-alerts-read";

type InspectPageProps = {
  params: { inspectionId: string };
};

export default async function InspectPage({ params }: InspectPageProps) {
  const session = await getInspectSession();
  if (!session) redirect("/sign-in");

  const [inspection, billing, preJobBrief] = await Promise.all([
    getInspectionForForm(session, params.inspectionId),
    getCompanyBillingSnapshot(session, session.email),
    getPreJobBriefForInspection(session, params.inspectionId),
  ]);
  if (!inspection) notFound();

  if (session.role === "technician") {
    await markJobAlertsReadForInspection(params.inspectionId);
  }

  return (
    <InspectionFormShell
      inspectionId={params.inspectionId}
      serverInspection={serializeInspectionForClient(inspection)}
      serverPreJobBrief={preJobBrief ? serializePreJobBrief(preJobBrief) : null}
      writeAccess={billing?.hasAccess ?? false}
      billingMessage={billing?.message ?? "Subscribe to continue using GetFlareflow."}
      checkoutUrl={billing?.checkoutUrl ?? null}
      inlineCheckoutReady={billing?.inlineCheckoutReady ?? false}
      designPartner={billing?.designPartner ?? false}
      role={session.role}
    />
  );
}
