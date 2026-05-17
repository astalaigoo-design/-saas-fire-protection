import { notFound, redirect } from "next/navigation";
import { InspectionForm } from "@/components/inspect/inspection-form";
import { getInspectSession } from "@/lib/inspect/access";
import { getInspectionForForm } from "@/lib/inspect/queries";

type InspectPageProps = {
  params: { inspectionId: string };
};

export default async function InspectPage({ params }: InspectPageProps) {
  const session = await getInspectSession();
  if (!session) redirect("/sign-in");

  const inspection = await getInspectionForForm(session, params.inspectionId);
  if (!inspection) notFound();

  return <InspectionForm inspection={inspection} />;
}
