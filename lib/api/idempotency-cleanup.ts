import { prisma } from "@/lib/prisma";

export type IdempotencyCleanupResult = {
  deleted: number;
};

export async function cleanupExpiredIdempotencyKeys(): Promise<IdempotencyCleanupResult> {
  const now = new Date();
  const result = await prisma.idempotencyKey.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return { deleted: result.count };
}

