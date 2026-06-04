import type { DashboardSession } from "@/lib/dashboard/session";
import { branchScopeFromSession, customerWhereFromScope } from "@/lib/branches/scope";
import { prisma } from "@/lib/prisma";

export type DuplicateCustomerGroup = {
  reason: "name" | "email";
  key: string;
  customers: { id: string; name: string; email: string | null }[];
};

export function normalizeCustomerName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

export async function findDuplicateCustomerGroups(
  session: DashboardSession,
): Promise<DuplicateCustomerGroup[]> {
  const scope = branchScopeFromSession(session);
  const customers = await prisma.customer.findMany({
    where: customerWhereFromScope(scope, session.companyId),
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const byName = new Map<string, DuplicateCustomerGroup["customers"]>();
  const byEmail = new Map<string, DuplicateCustomerGroup["customers"]>();

  for (const customer of customers) {
    const normalized = normalizeCustomerName(customer.name);
    if (normalized.length >= 2) {
      const list = byName.get(normalized) ?? [];
      list.push(customer);
      byName.set(normalized, list);
    }

    const email = customer.email?.trim().toLowerCase();
    if (email) {
      const list = byEmail.get(email) ?? [];
      list.push(customer);
      byEmail.set(email, list);
    }
  }

  const groups: DuplicateCustomerGroup[] = [];

  for (const [key, list] of byName) {
    if (list.length > 1) {
      groups.push({ reason: "name", key, customers: list });
    }
  }

  for (const [key, list] of byEmail) {
    if (list.length > 1) {
      const ids = new Set(list.map((c) => c.id));
      const alreadyCovered = groups.some(
        (g) =>
          g.reason === "name" &&
          g.customers.length === list.length &&
          g.customers.every((c) => ids.has(c.id)),
      );
      if (!alreadyCovered) {
        groups.push({ reason: "email", key, customers: list });
      }
    }
  }

  return groups.sort((a, b) => a.customers[0].name.localeCompare(b.customers[0].name));
}

export async function listMergeCandidateCustomers(
  session: DashboardSession,
  customerId: string,
): Promise<{ id: string; name: string; buildingCount: number }[]> {
  const scope = branchScopeFromSession(session);
  return prisma.customer.findMany({
    where: {
      ...customerWhereFromScope(scope, session.companyId),
      id: { not: customerId },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { buildings: true } },
    },
    orderBy: { name: "asc" },
    take: 200,
  }).then((rows) =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      buildingCount: row._count.buildings,
    })),
  );
}
