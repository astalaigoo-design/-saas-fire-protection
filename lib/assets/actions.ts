"use server";

import { revalidatePath } from "next/cache";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getBuildingById } from "@/lib/buildings/queries";
import {
  createBuildingAssetSchema,
  updateBuildingAssetSchema,
  buildingAssetIdSchema,
} from "@/lib/assets/schemas";
import { getBuildingAssetInScope } from "@/lib/assets/queries";
import { assetTypeLabel } from "@/lib/assets/constants";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseDateInputValue } from "@/lib/scheduling/calendar";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type BuildingAssetActionResult = { ok: true } | { ok: false; error: string };

function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

function parseOptionalDate(value: string | undefined, label: string): Date | null | "invalid" {
  if (!value) return null;
  const parsed = parseDateInputValue(value);
  if (!parsed) return "invalid";
  return parsed;
}

function revalidateAssetPaths(buildingId: string, customerId: string): void {
  revalidatePath(`/dashboard/buildings/${buildingId}`);
  revalidatePath(`/dashboard/customers/${customerId}`);
}

async function guardWritable() {
  const session = await getDashboardSession();
  if (!session) return { ok: false as const, error: "Sign in required." };
  ensureCanManageCustomers(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false as const, error: tenant.error };

  return { ok: true as const, session };
}

export async function createBuildingAsset(
  _prev: BuildingAssetActionResult,
  formData: FormData,
): Promise<BuildingAssetActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = createBuildingAssetSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const building = await getBuildingById(guard.session, parsed.data.buildingId);
  if (!building) return { ok: false, error: "Building not found." };

  const lastServiceAt = parseOptionalDate(parsed.data.lastServiceAt, "Last service");
  if (lastServiceAt === "invalid") {
    return { ok: false, error: "Enter a valid last service date (YYYY-MM-DD)." };
  }
  const nextServiceDue = parseOptionalDate(parsed.data.nextServiceDue, "Next service");
  if (nextServiceDue === "invalid") {
    return { ok: false, error: "Enter a valid next service date (YYYY-MM-DD)." };
  }

  try {
    const asset = await prisma.buildingAsset.create({
      data: {
        buildingId: building.id,
        assetType: parsed.data.assetType,
        tagNumber: parsed.data.tagNumber || null,
        barcodeValue: parsed.data.barcodeValue || null,
        location: parsed.data.location,
        manufacturer: parsed.data.manufacturer || null,
        model: parsed.data.model || null,
        serialNumber: parsed.data.serialNumber || null,
        lastServiceAt,
        nextServiceDue,
        notes: parsed.data.notes || null,
      },
      select: { id: true },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "asset.created",
      entityType: "asset",
      entityId: asset.id,
      metadata: {
        buildingId: building.id,
        assetType: parsed.data.assetType,
        location: parsed.data.location,
      },
    });

    revalidateAssetPaths(building.id, building.customerId);
    return { ok: true };
  } catch (error) {
    captureServerActionError("createBuildingAsset", error);
    return { ok: false, error: "Could not add equipment. Please try again." };
  }
}

export async function updateBuildingAsset(
  _prev: BuildingAssetActionResult,
  formData: FormData,
): Promise<BuildingAssetActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = updateBuildingAssetSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getBuildingAssetInScope(guard.session, parsed.data.assetId);
  if (!existing || existing.buildingId !== parsed.data.buildingId) {
    return { ok: false, error: "Equipment not found." };
  }
  if (!existing.active) {
    return { ok: false, error: "This item was removed from the register." };
  }

  const building = await getBuildingById(guard.session, parsed.data.buildingId);
  if (!building) return { ok: false, error: "Building not found." };

  const lastServiceAt = parseOptionalDate(parsed.data.lastServiceAt, "Last service");
  if (lastServiceAt === "invalid") {
    return { ok: false, error: "Enter a valid last service date (YYYY-MM-DD)." };
  }
  const nextServiceDue = parseOptionalDate(parsed.data.nextServiceDue, "Next service");
  if (nextServiceDue === "invalid") {
    return { ok: false, error: "Enter a valid next service date (YYYY-MM-DD)." };
  }

  try {
    await prisma.buildingAsset.update({
      where: { id: existing.id },
      data: {
        assetType: parsed.data.assetType,
        tagNumber: parsed.data.tagNumber || null,
        barcodeValue: parsed.data.barcodeValue || null,
        location: parsed.data.location,
        manufacturer: parsed.data.manufacturer || null,
        model: parsed.data.model || null,
        serialNumber: parsed.data.serialNumber || null,
        lastServiceAt,
        nextServiceDue,
        notes: parsed.data.notes || null,
      },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "asset.updated",
      entityType: "asset",
      entityId: existing.id,
      metadata: {
        buildingId: building.id,
        assetType: parsed.data.assetType,
      },
    });

    revalidateAssetPaths(building.id, building.customerId);
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateBuildingAsset", error);
    return { ok: false, error: "Could not update equipment. Please try again." };
  }
}

export async function retireBuildingAsset(
  _prev: BuildingAssetActionResult,
  formData: FormData,
): Promise<BuildingAssetActionResult> {
  const guard = await guardWritable();
  if (!guard.ok) return guard;

  const parsed = buildingAssetIdSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getBuildingAssetInScope(guard.session, parsed.data.assetId);
  if (!existing || existing.buildingId !== parsed.data.buildingId) {
    return { ok: false, error: "Equipment not found." };
  }

  const building = await getBuildingById(guard.session, parsed.data.buildingId);
  if (!building) return { ok: false, error: "Building not found." };

  if (!existing.active) return { ok: true };

  try {
    await prisma.buildingAsset.update({
      where: { id: existing.id },
      data: { active: false },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "asset.retired",
      entityType: "asset",
      entityId: existing.id,
      metadata: {
        buildingId: building.id,
        label: assetTypeLabel(existing.assetType),
      },
    });

    revalidateAssetPaths(building.id, building.customerId);
    return { ok: true };
  } catch (error) {
    captureServerActionError("retireBuildingAsset", error);
    return { ok: false, error: "Could not remove equipment. Please try again." };
  }
}
