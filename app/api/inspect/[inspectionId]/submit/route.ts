import { NextResponse } from "next/server";
import { submitInspection } from "@/lib/inspect/actions";

type SubmitRouteProps = {
  params: { inspectionId: string };
};

export async function POST(request: Request, { params }: SubmitRouteProps) {
  let payload: { signatureData?: unknown } = {};
  try {
    payload = (await request.json()) as { signatureData?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const result = await submitInspection({
    inspectionId: params.inspectionId,
    signatureData: payload.signatureData,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
