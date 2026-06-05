import { CustomerContactRole, type RecurrenceInterval } from "@prisma/client";
import { assertWritableCompany } from "@/lib/billing/assert-writable-company";
import { getDefaultBranchId } from "@/lib/branches/default-branch";
import { writeAuditEvent } from "@/lib/audit/write-event";
import {
  emitCustomerCreatedWebhook,
} from "@/lib/integrations/emit";
import type { V1CreateCustomerInput, V1CreateInspectionInput } from "@/lib/integrations/v1-write-schemas";
import { resolveInspectionChecklistCreateInputs } from "@/lib/inspections/resolve-checklist-items";
import { notifyInspectionScheduled } from "@/lib/notifications/notify-inspection-scheduled";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { prisma } from "@/lib/prisma";
import {
  buildRecurrenceSchedule,
  type RecurrenceOption,
} from "@/lib/scheduling/recurrence";

export type V1WriteResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: 400 | 402 | 404 | 409 | 500 };

export async function createCustomerV1(
  companyId: string,
  input: V1CreateCustomerInput,
): Promise<
  V1WriteResult<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    branchId: string;
    buildingId: string | null;
    createdAt: string;
  }>
> {
  const tenant = await assertWritableCompany(companyId);
  if (!tenant.ok) {
    return { ok: false, error: tenant.error, status: tenant.status };
  }

  let branchId = input.branchId;
  if (branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId },
      select: { id: true },
    });
    if (!branch) {
      return { ok: false, error: "branchId is not valid for this company.", status: 400 };
    }
  } else {
    branchId = await getDefaultBranchId(companyId);
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        companyId,
        branchId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        ...(input.email || input.phone
          ? {
              contacts: {
                create: {
                  name: input.name,
                  email: input.email ?? null,
                  phone: input.phone ?? null,
                  role: CustomerContactRole.billing,
                },
              },
            }
          : {}),
        ...(input.building
          ? {
              buildings: {
                create: {
                  name: input.building.name?.trim() || null,
                  addressLine1: input.building.addressLine1,
                  addressLine2: input.building.addressLine2?.trim() || null,
                  city: input.building.city,
                  region: input.building.region,
                  postalCode: input.building.postalCode,
                  country: input.building.country,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        branchId: true,
        createdAt: true,
        buildings: { select: { id: true }, take: 1, orderBy: { createdAt: "asc" } },
      },
    });

    await writeAuditEvent({
      companyId,
      actorUserId: null,
      action: "customer.created",
      entityType: "customer",
      entityId: customer.id,
      metadata: {
        name: customer.name,
        source: "api_v1",
        externalRef: input.externalRef ?? null,
      },
    });

    try {
      await emitCustomerCreatedWebhook(companyId, customer.id);
    } catch (error) {
      console.error("emitCustomerCreatedWebhook failed", error);
    }

    return {
      ok: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        branchId: customer.branchId,
        buildingId: customer.buildings[0]?.id ?? null,
        createdAt: customer.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("createCustomerV1 failed", error);
    return { ok: false, error: "Could not create customer.", status: 500 };
  }
}

export async function scheduleInspectionV1(
  companyId: string,
  input: V1CreateInspectionInput,
): Promise<
  V1WriteResult<{
    id: string;
    buildingId: string;
    customerId: string;
    status: string;
    inspectionType: string;
    inspectionTypeCode: string;
    scheduledAt: string;
    assignedToUserId: string | null;
    occurrenceCount: number;
  }>
> {
  const tenant = await assertWritableCompany(companyId);
  if (!tenant.ok) {
    return { ok: false, error: tenant.error, status: tenant.status };
  }

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "scheduledAt must be a valid ISO-8601 datetime.", status: 400 };
  }

  const building = await prisma.building.findFirst({
    where: { id: input.buildingId, customer: { companyId } },
    select: { id: true, customerId: true },
  });
  if (!building) {
    return { ok: false, error: "buildingId is not valid for this company.", status: 404 };
  }

  const inspectionType = await prisma.inspectionType.findFirst({
    where: {
      companyId,
      ...(input.inspectionTypeId
        ? { id: input.inspectionTypeId }
        : { code: input.inspectionTypeCode! }),
    },
    select: { id: true, name: true, code: true },
  });
  if (!inspectionType) {
    return { ok: false, error: "Inspection type not found.", status: 404 };
  }

  const assignedToUserId = input.assignedToUserId ?? null;
  if (assignedToUserId) {
    const technician = await prisma.user.findFirst({
      where: { id: assignedToUserId, companyId, role: "technician", active: true },
      select: { id: true },
    });
    if (!technician) {
      return { ok: false, error: "assignedToUserId is not a valid technician.", status: 400 };
    }
  }

  const recurrence = input.recurrence as RecurrenceOption;
  const dates = buildRecurrenceSchedule(scheduledAt, recurrence);
  const recurrenceGroupId = recurrence === "none" ? null : crypto.randomUUID();
  const recurrenceInterval: RecurrenceInterval | null =
    recurrence === "none" ? null : recurrence;

  const checklistItems = await resolveInspectionChecklistCreateInputs(inspectionType.id);

  let firstInspectionId: string | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      for (const occurrenceDate of dates) {
        const created = await tx.inspection.create({
          data: {
            companyId,
            buildingId: building.id,
            inspectionTypeId: inspectionType.id,
            assignedToUserId,
            scheduledAt: occurrenceDate,
            recurrenceGroupId,
            recurrenceInterval,
            notes: input.notes ?? null,
            items: { create: checklistItems },
          },
          select: { id: true },
        });
        firstInspectionId ??= created.id;
      }
    });
  } catch (error) {
    console.error("scheduleInspectionV1 failed", error);
    return { ok: false, error: "Could not schedule inspection.", status: 500 };
  }

  if (!firstInspectionId) {
    return { ok: false, error: "Could not schedule inspection.", status: 500 };
  }

  await syncBuildingComplianceStatus(building.id);

  await writeAuditEvent({
    companyId,
    actorUserId: null,
    action: "inspection.scheduled",
    entityType: "inspection",
    entityId: firstInspectionId,
    metadata: {
      occurrenceCount: dates.length,
      buildingId: building.id,
      assignedToUserId,
      source: "api_v1",
      externalRef: input.externalRef ?? null,
    },
  });

  try {
    await notifyInspectionScheduled({
      companyId,
      inspectionId: firstInspectionId,
      occurrenceCount: dates.length,
    });
  } catch (error) {
    console.warn("notifyInspectionScheduled from v1 failed", error);
  }

  const row = await prisma.inspection.findFirst({
    where: { id: firstInspectionId, companyId },
    select: {
      id: true,
      buildingId: true,
      status: true,
      scheduledAt: true,
      assignedToUserId: true,
      building: { select: { customerId: true } },
      inspectionType: { select: { name: true, code: true } },
    },
  });

  if (!row) {
    return { ok: false, error: "Could not load scheduled inspection.", status: 500 };
  }

  return {
    ok: true,
    data: {
      id: row.id,
      buildingId: row.buildingId,
      customerId: row.building.customerId,
      status: row.status,
      inspectionType: row.inspectionType.name,
      inspectionTypeCode: row.inspectionType.code,
      scheduledAt: row.scheduledAt.toISOString(),
      assignedToUserId: row.assignedToUserId,
      occurrenceCount: dates.length,
    },
  };
}
