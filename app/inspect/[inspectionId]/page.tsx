import { notFound, redirect } from "next/navigation";
import { InspectionFormShell } from "@/components/inspect/inspection-form-shell";
import { getCompanyBillingSnapshot } from "@/lib/billing/queries";
import { getInspectSession } from "@/lib/inspect/access";
import { serializeInspectionForClient } from "@/lib/inspect/serialize-for-client";
import { getInspectionForForm } from "@/lib/inspect/queries";

type InspectPageProps = {
  params: { inspectionId: string };
};

export default async function InspectPage({ params }: InspectPageProps) {
  const session = await getInspectSession();
  if (!session) redirect("/sign-in");

  const [inspection, billing] = await Promise.all([
    getInspectionForForm(session, params.inspectionId),
    getCompanyBillingSnapshot(session, session.email),
  ]);
  if (!inspection) notFound();

  return (
    <InspectionFormShell
      inspectionId={params.inspectionId}
      serverInspection={serializeInspectionForClient(inspection)}
      writeAccess={billing?.hasAccess ?? false}
      billingMessage={billing?.message ?? "Subscribe to continue using GetFlareflow."}
      checkoutUrl={billing?.checkoutUrl ?? null}
      role={session.role}
    />
  );
}
