import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/authorize";
import { captureRouteError } from "@/lib/monitoring/capture";
import { sendTechnicianDayOfReminders } from "@/lib/scheduling/technician-day-of-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendTechnicianDayOfReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    captureRouteError("GET /api/cron/technician-day-of", error);
    return NextResponse.json({ error: "Internal cron error" }, { status: 500 });
  }
}
