import { NextResponse } from "next/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.auditEvent.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, events });
}

