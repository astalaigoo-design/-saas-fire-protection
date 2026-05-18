"use server";

import { revalidatePath } from "next/cache";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { getBuildingById } from "@/lib/buildings/queries";
import { addBuildingNoteSchema, updateBuildingSchema } from "@/lib/buildings/schemas";
import { getDashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type BuildingActionResult = { ok: true } | { ok: false; error: string };

function revalidateBuildingPaths(buildingId: string, customerId: string) {
  revalidatePath(`/dashboard/buildings/${buildingId}`);
  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/customers");
}

export async function updateBuilding(
  _prev: BuildingActionResult,
  formData: FormData,
): Promise<BuildingActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  ensureCanManageCustomers(session.role);

  const parsed = updateBuildingSchema.safeParse({
    buildingId: formData.get("buildingId"),
    name: formData.get("name"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") || "US",
    buildingType: formData.get("buildingType"),
    fireDistrict: formData.get("fireDistrict"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getBuildingById(session.companyId, parsed.data.buildingId);
  if (!existing) return { ok: false, error: "Building not found." };

  const d = parsed.data;
  await prisma.building.update({
    where: { id: d.buildingId },
    data: {
      name: d.name || null,
      addressLine1: d.addressLine1,
      addressLine2: d.addressLine2 || null,
      city: d.city,
      region: d.region,
      postalCode: d.postalCode,
      country: d.country,
      buildingType: d.buildingType || null,
      fireDistrict: d.fireDistrict || null,
      notes: d.notes || null,
    },
  });

  revalidateBuildingPaths(d.buildingId, existing.customerId);
  return { ok: true };
}

export async function addBuildingNote(
  _prev: BuildingActionResult,
  formData: FormData,
): Promise<BuildingActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  ensureCanManageCustomers(session.role);

  const parsed = addBuildingNoteSchema.safeParse({
    buildingId: formData.get("buildingId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getBuildingById(session.companyId, parsed.data.buildingId);
  if (!existing) return { ok: false, error: "Building not found." };

  await prisma.buildingNote.create({
    data: {
      buildingId: parsed.data.buildingId,
      body: parsed.data.body,
      authorName: session.email ?? session.companyName,
    },
  });

  revalidateBuildingPaths(parsed.data.buildingId, existing.customerId);
  return { ok: true };
}
