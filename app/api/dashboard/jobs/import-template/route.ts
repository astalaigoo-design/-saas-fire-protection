import { NextResponse } from "next/server";
import { canManageJobs } from "@/lib/auth/permissions";
import { scheduleImportTemplateCsv } from "@/lib/scheduling/import-csv-template";
import { getDashboardSession } from "@/lib/dashboard/session";

export async function GET() {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageJobs(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv = scheduleImportTemplateCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="schedule-import-template.csv"',
    },
  });
}
