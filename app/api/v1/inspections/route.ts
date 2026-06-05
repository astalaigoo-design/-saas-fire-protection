import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import {
  v1CreateInspectionSchema,
  type V1CreateInspectionInput,
} from "@/lib/integrations/v1-write-schemas";
import {
  v1Created,
  v1WriteError,
  withApiAuthPost,
} from "@/lib/integrations/v1-write-route";
import { createCustomerV1, scheduleInspectionV1 } from "@/lib/integrations/v1-write";
import { listInspectionsV1, withApiAuth } from "@/lib/integrations/v1-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiAuth(request, async (ctx, searchParams) => {
    try {
      return listInspectionsV1(ctx.companyId, searchParams);
    } catch (error) {
      captureRouteError("GET /api/v1/inspections", error);
      return NextResponse.json({ error: "Failed to list inspections." }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  return withApiAuthPost<V1CreateInspectionInput>(
    request,
    "v1:inspections:create",
    async (_ctx, body) => {
      try {
        const result = await scheduleInspectionV1(_ctx.companyId, body);
        if (!result.ok) {
          return v1WriteError(result.error, result.status);
        }
        return v1Created(result.data);
      } catch (error) {
        captureRouteError("POST /api/v1/inspections", error);
        return v1WriteError("Could not schedule inspection.", 500);
      }
    },
    (raw) => {
      const parsed = v1CreateInspectionSchema.safeParse(raw);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid request body.";
        return { ok: false, error: message };
      }
      return { ok: true, data: parsed.data };
    },
  );
}
