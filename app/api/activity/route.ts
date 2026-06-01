import { NextResponse } from "next/server";
import { canManageJobs } from "@/lib/auth/permissions";
import { listAuditEvents } from "@/lib/audit/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

/** @deprecated Prefer GET /api/audit — kept for integrations. */
export async function GET() {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageJobs(session.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const page = await listAuditEvents(session, { limit: 50 });

  return NextResponse.json({
    ok: true,
    events: page.events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
      actor: event.actorEmail
        ? {
            email: event.actorEmail,
            name: event.actorName,
          }
        : null,
    })),
    nextCursor: page.nextCursor,
  });
}

