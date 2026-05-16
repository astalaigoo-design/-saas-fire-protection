import { NextResponse } from "next/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { generateComplianceReport } from "@/lib/reports/generate-compliance-report";

type RouteContext = {
  params: { inspectionId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { buffer, filename } = await generateComplianceReport(
      session,
      context.params.inspectionId,
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate report.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
