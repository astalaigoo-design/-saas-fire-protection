import { NextResponse } from "next/server";
import {
  authenticateApiRequest,
  isApiAuthContext,
} from "@/lib/integrations/authenticate";
import { parseV1ListParams } from "@/lib/integrations/v1-queries";
import { prisma } from "@/lib/prisma";

export async function withApiAuth(
  request: Request,
  handler: (ctx: { companyId: string }, params: URLSearchParams) => Promise<NextResponse>,
): Promise<NextResponse> {
  const auth = await authenticateApiRequest(request);
  if (!isApiAuthContext(auth)) return auth;
  const { searchParams } = new URL(request.url);
  return handler(auth, searchParams);
}

export function v1Json(data: unknown, meta?: Record<string, unknown>): NextResponse {
  return NextResponse.json(meta ? { data, meta } : { data });
}

export async function listInspectionsV1(companyId: string, searchParams: URLSearchParams) {
  const { limit, since } = parseV1ListParams(searchParams);
  const rows = await prisma.inspection.findMany({
    where: {
      companyId,
      ...(since
        ? {
            OR: [
              { updatedAt: { gte: since } },
              { completedAt: { gte: since } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      buildingId: true,
      status: true,
      scheduledAt: true,
      completedAt: true,
      inspectionType: { select: { name: true, code: true } },
      building: {
        select: {
          name: true,
          customerId: true,
          customer: { select: { name: true } },
        },
      },
    },
  });
  return v1Json(
    rows.map((row) => ({
      id: row.id,
      buildingId: row.buildingId,
      customerId: row.building.customerId,
      customerName: row.building.customer.name,
      buildingName: row.building.name,
      status: row.status,
      inspectionType: row.inspectionType.name,
      inspectionTypeCode: row.inspectionType.code,
      scheduledAt: row.scheduledAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
    })),
    { limit, count: rows.length },
  );
}

export async function listCustomersV1(companyId: string, searchParams: URLSearchParams) {
  const { limit, since } = parseV1ListParams(searchParams);
  const rows = await prisma.customer.findMany({
    where: {
      companyId,
      ...(since ? { updatedAt: { gte: since } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      branchId: true,
      updatedAt: true,
    },
  });
  return v1Json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      branchId: row.branchId,
      updatedAt: row.updatedAt.toISOString(),
    })),
    { limit, count: rows.length },
  );
}

export async function listBuildingsV1(companyId: string, searchParams: URLSearchParams) {
  const { limit, since } = parseV1ListParams(searchParams);
  const rows = await prisma.building.findMany({
    where: {
      customer: { companyId },
      ...(since ? { updatedAt: { gte: since } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      customerId: true,
      name: true,
      addressLine1: true,
      city: true,
      region: true,
      postalCode: true,
      currentStatus: true,
      permitNumber: true,
      permitExpiresAt: true,
      updatedAt: true,
    },
  });
  return v1Json(
    rows.map((row) => ({
      id: row.id,
      customerId: row.customerId,
      name: row.name,
      addressLine1: row.addressLine1,
      city: row.city,
      region: row.region,
      postalCode: row.postalCode,
      complianceStatus: row.currentStatus,
      permitNumber: row.permitNumber,
      permitExpiresAt: row.permitExpiresAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    })),
    { limit, count: rows.length },
  );
}

export async function listDeficienciesV1(companyId: string, searchParams: URLSearchParams) {
  const { limit, since } = parseV1ListParams(searchParams);
  const rows = await prisma.deficiency.findMany({
    where: {
      companyId,
      ...(since ? { updatedAt: { gte: since } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      buildingId: true,
      label: true,
      status: true,
      dueAt: true,
      sourceInspectionId: true,
      building: { select: { customerId: true, name: true } },
      updatedAt: true,
    },
  });
  return v1Json(
    rows.map((row) => ({
      id: row.id,
      buildingId: row.buildingId,
      customerId: row.building.customerId,
      buildingName: row.building.name,
      label: row.label,
      status: row.status,
      dueAt: row.dueAt?.toISOString() ?? null,
      sourceInspectionId: row.sourceInspectionId,
      updatedAt: row.updatedAt.toISOString(),
    })),
    { limit, count: rows.length },
  );
}
