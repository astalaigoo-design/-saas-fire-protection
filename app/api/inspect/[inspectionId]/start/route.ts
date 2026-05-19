import { NextResponse } from "next/server";
import { startInspection } from "@/lib/inspect/actions";

type StartRouteProps = {
  params: { inspectionId: string };
};

export async function POST(_request: Request, { params }: StartRouteProps) {
  const result = await startInspection(params.inspectionId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
