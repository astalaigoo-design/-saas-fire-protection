import type { Prisma } from "@prisma/client";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export function parseV1ListParams(searchParams: URLSearchParams): {
  limit: number;
  since: Date | undefined;
} {
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(1, limitRaw), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const sinceRaw = searchParams.get("since")?.trim();
  let since: Date | undefined;
  if (sinceRaw) {
    const parsed = new Date(sinceRaw);
    if (!Number.isNaN(parsed.getTime())) since = parsed;
  }

  return { limit, since };
}

export function inspectionsV1Where(
  companyId: string,
  since: Date | undefined,
): Prisma.InspectionWhereInput {
  return {
    companyId,
    ...(since
      ? {
          OR: [
            { updatedAt: { gte: since } },
            { completedAt: { gte: since } },
          ],
        }
      : {}),
  };
}

export function customersV1Where(
  companyId: string,
  since: Date | undefined,
): Prisma.CustomerWhereInput {
  return {
    companyId,
    ...(since ? { updatedAt: { gte: since } } : {}),
  };
}

export function buildingsV1Where(
  companyId: string,
  since: Date | undefined,
): Prisma.BuildingWhereInput {
  return {
    customer: { companyId },
    ...(since ? { updatedAt: { gte: since } } : {}),
  };
}

export function deficienciesV1Where(
  companyId: string,
  since: Date | undefined,
): Prisma.DeficiencyWhereInput {
  return {
    companyId,
    ...(since ? { updatedAt: { gte: since } } : {}),
  };
}
