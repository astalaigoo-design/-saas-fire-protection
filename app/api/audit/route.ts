import { NextResponse } from "next/server";
import { canManageJobs } from "@/lib/auth/permissions";
import { listAuditEvents } from "@/lib/audit/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureRouteError } from "@/lib/monitoring/capture";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageJobs(session.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const action = params.get("action")?.trim() || undefined;
  const entityType = params.get("entity")?.trim() || undefined;
  const cursor = params.get("cursor")?.trim() || undefined;
  const limitRaw = params.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  try {
    const page = await listAuditEvents(session, {
      action,
      entityType,
      cursor,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({
      ok: true,
      events: page.events.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    captureRouteError("GET /api/audit", error);
    return NextResponse.json({ ok: false, error: "Could not load audit log." }, { status: 500 });
  }
}
