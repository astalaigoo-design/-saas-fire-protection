import { NextResponse } from "next/server";
import { getInspectSession } from "@/lib/inspect/access";
import { serializeInspectionForClient } from "@/lib/inspect/serialize-for-client";
import { getInspectionForForm } from "@/lib/inspect/queries";

type InspectionRouteProps = {
  params: { inspectionId: string };
};

export async function GET(_request: Request, { params }: InspectionRouteProps) {
  const session = await getInspectSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const inspection = await getInspectionForForm(session, params.inspectionId);
  if (!inspection) {
    return NextResponse.json({ ok: false, error: "Inspection not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    inspection: serializeInspectionForClient(inspection),
  });
}
