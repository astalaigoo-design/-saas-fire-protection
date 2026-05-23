import { redirect } from "next/navigation";
import { inspectOfflineHref } from "@/lib/offline/inspect-route";

type InspectPageProps = {
  params: { inspectionId: string };
};

/** All field inspections use the client shell + API/IndexedDB (works online and offline). */
export default function InspectPage({ params }: InspectPageProps) {
  redirect(inspectOfflineHref(params.inspectionId));
}
