import { NextResponse } from "next/server";
import { captureRouteError } from "@/lib/monitoring/capture";
import { v1CreateCustomerSchema, type V1CreateCustomerInput } from "@/lib/integrations/v1-write-schemas";
import {
  v1Created,
  v1WriteError,
  withApiAuthPost,
} from "@/lib/integrations/v1-write-route";
import { createCustomerV1 } from "@/lib/integrations/v1-write";
import { listCustomersV1, withApiAuth } from "@/lib/integrations/v1-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiAuth(request, async (ctx, searchParams) => {
    try {
      return listCustomersV1(ctx.companyId, searchParams);
    } catch (error) {
      captureRouteError("GET /api/v1/customers", error);
      return NextResponse.json({ error: "Failed to list customers." }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  return withApiAuthPost<V1CreateCustomerInput>(
    request,
    "v1:customers:create",
    async (ctx, body) => {
      try {
        const result = await createCustomerV1(ctx.companyId, body);
        if (!result.ok) {
          return v1WriteError(result.error, result.status);
        }
        return v1Created(result.data);
      } catch (error) {
        captureRouteError("POST /api/v1/customers", error);
        return v1WriteError("Could not create customer.", 500);
      }
    },
    (raw) => {
      const parsed = v1CreateCustomerSchema.safeParse(raw);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid request body.";
        return { ok: false, error: message };
      }
      return { ok: true, data: parsed.data };
    },
  );
}
