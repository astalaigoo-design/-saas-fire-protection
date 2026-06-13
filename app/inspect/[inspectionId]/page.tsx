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

async function loadBillingSnapshot(
  session: NonNullable<Awaited<ReturnType<typeof getInspectSession>>>,
) {
  try {
    return await getCompanyBillingSnapshot(session, session.email);
  } catch (error) {
    console.error("inspect page billing snapshot failed", error);
    return null;
  }
}

async function loadPreJobBrief(
  session: NonNullable<Awaited<ReturnType<typeof getInspectSession>>>,
  inspectionId: string,
) {
  try {
    return await getPreJobBriefForInspection(session, inspectionId);
  } catch (error) {
    console.error("inspect page pre-job brief failed", error, { inspectionId });
    return null;
  }
}

export default async function InspectPage({ params }: InspectPageProps) {
  const session = await getInspectSession();
  if (!session) redirect("/sign-in");

  const inspection = await getInspectionForForm(session, params.inspectionId);
  if (!inspection) notFound();

  const [billing, preJobBrief] = await Promise.all([
    loadBillingSnapshot(session),
    loadPreJobBrief(session, params.inspectionId),
  ]);

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
