import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import { listBuildingsV1, withApiAuth } from "@/lib/integrations/v1-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiAuth(request, async (ctx, searchParams) => {
    try {
      return listBuildingsV1(ctx.companyId, searchParams);
    } catch (error) {
      captureRouteError("api/v1/buildings", error);
      return NextResponse.json({ error: "Failed to list buildings." }, { status: 500 });
    }
  });
}
