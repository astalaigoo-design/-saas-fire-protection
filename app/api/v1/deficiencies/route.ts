import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import { listDeficienciesV1, withApiAuth } from "@/lib/integrations/v1-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiAuth(request, async (ctx, searchParams) => {
    try {
      return listDeficienciesV1(ctx.companyId, searchParams);
    } catch (error) {
      captureRouteError("api/v1/deficiencies", error);
      return NextResponse.json({ error: "Failed to list deficiencies." }, { status: 500 });
    }
  });
}
