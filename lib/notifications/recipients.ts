import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Distinct emails for active owners and admins (optional staff alerts). */
export async function listOwnerAdminEmails(companyId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      deletedAt: null,
      role: { in: [UserRole.owner, UserRole.admin] },
      email: { not: null },
    },
    select: { email: true },
  });

  const seen = new Set<string>();
  const out: string[] = [];
  for (const user of users) {
    const email = user.email?.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}
