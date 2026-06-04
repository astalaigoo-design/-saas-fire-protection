import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import { listInspectionsV1, withApiAuth } from "@/lib/integrations/v1-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiAuth(request, async (ctx, searchParams) => {
    try {
      return listInspectionsV1(ctx.companyId, searchParams);
    } catch (error) {
      captureRouteError("api/v1/inspections", error);
      return NextResponse.json({ error: "Failed to list inspections." }, { status: 500 });
    }
  });
}
