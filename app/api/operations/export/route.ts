import { NextResponse } from "next/server";
import { canManageJobs } from "@/lib/auth/permissions";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureRouteError } from "@/lib/monitoring/capture";
import { generateOperationsExport } from "@/lib/operations/export-csv";

export const dynamic = "force-dynamic";

const EXPORT_TYPES = ["due", "deficiencies", "equipment-due"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

function isExportType(value: string | null): value is ExportType {
  return value !== null && (EXPORT_TYPES as readonly string[]).includes(value);
}

function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: Request) {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to export." }, { status: 401 });
  }
  if (!canManageJobs(session.role)) {
    return NextResponse.json({ error: "You do not have permission to export." }, { status: 403 });
  }

  const typeParam = new URL(request.url).searchParams.get("type");
  if (!isExportType(typeParam)) {
    return NextResponse.json(
      {
        error:
          "Invalid export type. Use type=due, type=equipment-due, or type=deficiencies.",
      },
      { status: 400 },
    );
  }

  try {
    const { csv, filename } = await generateOperationsExport({
      session,
      type: typeParam,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": contentDisposition(filename),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    captureRouteError("GET /api/operations/export", error);
    return NextResponse.json({ error: "Could not generate export." }, { status: 500 });
  }
}
