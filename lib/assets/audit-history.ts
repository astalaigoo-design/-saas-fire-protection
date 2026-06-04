import type { AuditEventForDisplay } from "@/lib/audit/format-event";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

const ASSET_AUDIT_ACTIONS = ["asset.created", "asset.updated", "asset.retired"] as const;

/** Equipment register changes for one building (add, edit, remove). */
export async function listBuildingAssetAuditHistory(
  session: DashboardSession,
  buildingId: string,
  limit = 40,
): Promise<AuditEventForDisplay[]> {
  const events = await prisma.auditEvent.findMany({
    where: {
      companyId: session.companyId,
      entityType: "asset",
      action: { in: [...ASSET_AUDIT_ACTIONS] },
      metadata: {
        path: ["buildingId"],
        equals: buildingId,
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: event.metadata,
    createdAt: event.createdAt,
    actorName: event.actor?.name ?? null,
    actorEmail: event.actor?.email ?? null,
  }));
}
