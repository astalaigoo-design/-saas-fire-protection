import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";
import type { AuditEventForDisplay } from "@/lib/audit/format-event";

export type AuditLogFilters = {
  action?: string;
  entityType?: string;
  limit?: number;
  cursor?: string;
};

export type AuditLogPage = {
  events: AuditEventForDisplay[];
  nextCursor: string | null;
};

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 100;

function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}|${id}`;
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  const separator = cursor.indexOf("|");
  if (separator <= 0) return null;
  const createdAt = new Date(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}

export async function listAuditEvents(
  session: DashboardSession,
  filters: AuditLogFilters = {},
): Promise<AuditLogPage> {
  const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const cursor = filters.cursor ? decodeCursor(filters.cursor) : null;

  const events = await prisma.auditEvent.findMany({
    where: {
      companyId: session.companyId,
      ...(filters.action?.trim() ? { action: filters.action.trim() } : {}),
      ...(filters.entityType?.trim() ? { entityType: filters.entityType.trim() } : {}),
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
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

  const hasMore = events.length > limit;
  const page = hasMore ? events.slice(0, limit) : events;
  const last = page[page.length - 1];

  return {
    events: page.map((event) => ({
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
      createdAt: event.createdAt,
      actorName: event.actor?.name ?? null,
      actorEmail: event.actor?.email ?? null,
    })),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}
