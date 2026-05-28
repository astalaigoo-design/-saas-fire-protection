import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditWriteInput = {
  companyId: string;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function writeAuditEvent(input: AuditWriteInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        companyId: input.companyId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
      },
      select: { id: true },
    });
  } catch (error) {
    // Audit logging must never break primary flows.
    console.error("writeAuditEvent failed", error, {
      action: input.action,
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  }
}

