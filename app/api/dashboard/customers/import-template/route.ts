import { NextResponse } from "next/server";
import { canManageCustomers } from "@/lib/auth/permissions";
import { customerImportTemplateCsv } from "@/lib/customers/import-csv-template";
import { getDashboardSession } from "@/lib/dashboard/session";

export async function GET() {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageCustomers(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv = customerImportTemplateCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="customer-import-template.csv"',
    },
  });
}
