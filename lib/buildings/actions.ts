"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getBuildingById } from "@/lib/buildings/queries";
import {
  addBuildingNoteSchema,
  createBuildingSchema,
  updateBuildingSchema,
} from "@/lib/buildings/schemas";
import { getDefaultCountryForMarket } from "@/lib/market/operating-market";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import { parseDateInputValue } from "@/lib/scheduling/calendar";

async function resolveBuildingJurisdiction(
  companyId: string,
  jurisdictionId: string | undefined,
  fireDistrict: string | undefined,
): Promise<
  | { ok: true; jurisdictionId: string | null; fireDistrict: string | null }
  | { ok: false; error: string }
> {
  const id = jurisdictionId?.trim();
  if (!id) {
    return {
      ok: true,
      jurisdictionId: null,
      fireDistrict: fireDistrict?.trim() || null,
    };
  }

  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { id, companyId },
    select: { id: true, name: true },
  });
  if (!jurisdiction) {
    return { ok: false, error: "Selected jurisdiction is not valid." };
  }

  return {
    ok: true,
    jurisdictionId: jurisdiction.id,
    fireDistrict: jurisdiction.name,
  };
}

function parseOptionalPermitExpiresAt(
  raw: string | undefined,
): { ok: true; value: Date | null } | { ok: false; error: string } {
  if (!raw) return { ok: true, value: null };
  const parsedDate = parseDateInputValue(raw);
  if (!parsedDate) {
    return { ok: false, error: "Permit expiration must be a valid date (YYYY-MM-DD)." };
  }
  return { ok: true, value: parsedDate };
}

export type BuildingActionResult = { ok: true } | { ok: false; error: string };

function revalidateBuildingPaths(buildingId: string, customerId: string) {
  revalidatePath(`/dashboard/buildings/${buildingId}`);
  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/customers");
}

export async function createBuilding(
  _prev: BuildingActionResult,
  formData: FormData,
): Promise<BuildingActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  ensureCanManageCustomers(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const defaultCountry = getDefaultCountryForMarket(session.operatingMarket);

  const parsed = createBuildingSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") || defaultCountry,
    jurisdictionId: formData.get("jurisdictionId"),
    fireDistrict: formData.get("fireDistrict"),
    permitNumber: formData.get("permitNumber"),
    permitExpiresAt: formData.get("permitExpiresAt"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const permitExpiry = parseOptionalPermitExpiresAt(parsed.data.permitExpiresAt);
  if (!permitExpiry.ok) return { ok: false, error: permitExpiry.error };

  const jurisdiction = await resolveBuildingJurisdiction(
    session.companyId,
    parsed.data.jurisdictionId,
    parsed.data.fireDistrict,
  );
  if (!jurisdiction.ok) return { ok: false, error: jurisdiction.error };

  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: parsed.data.customerId,
        companyId: session.companyId,
      },
      select: { id: true },
    });

    if (!customer) return { ok: false, error: "Customer not found." };

    const building = await prisma.building.create({
      data: {
        customerId: customer.id,
        name: parsed.data.name || null,
        addressLine1: parsed.data.addressLine1,
        addressLine2: parsed.data.addressLine2 || null,
        city: parsed.data.city,
        region: parsed.data.region,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        jurisdictionId: jurisdiction.jurisdictionId,
        fireDistrict: jurisdiction.fireDistrict,
        permitNumber: parsed.data.permitNumber || null,
        permitExpiresAt: permitExpiry.value,
      },
      select: { id: true },
    });

    await writeAuditEvent({
      companyId: session.companyId,
      actorUserId: session.appUserId,
      action: "building.created",
      entityType: "building",
      entityId: building.id,
      metadata: {
        customerId: customer.id,
      },
    });

    revalidateBuildingPaths(building.id, customer.id);
    revalidatePath("/dashboard/buildings");
    revalidatePath("/dashboard/jobs/new");
    redirect(`/dashboard/buildings/${building.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    captureServerActionError("createBuilding", error);
    return { ok: false, error: "Could not create building. Please try again." };
  }
}

export async function updateBuilding(
  _prev: BuildingActionResult,
  formData: FormData,
): Promise<BuildingActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "Sign in required." };
  ensureCanManageCustomers(session.role);

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const defaultCountry = getDefaultCountryForMarket(session.operatingMarket);

  const parsed = updateBuildingSchema.safeParse({
    buildingId: formData.get("buildingId"),
    name: formData.get("name"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") || defaultCountry,
    buildingType: formData.get("buildingType"),
    jurisdictionId: formData.get("jurisdictionId"),
    fireDistrict: formData.get("fireDistrict"),
    permitNumber: formData.get("permitNumber"),
    permitExpiresAt: formData.get("permitExpiresAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getBuildingById(session, parsed.data.buildingId);
  if (!existing) return { ok: false, error: "Building not found." };

  const d = parsed.data;
  const permitExpiry = parseOptionalPermitExpiresAt(d.permitExpiresAt);
  if (!permitExpiry.ok) return { ok: false, error: permitExpiry.error };
  const permitExpiresAt = permitExpiry.value;

  const jurisdiction = await resolveBuildingJurisdiction(
    session.companyId,
    d.jurisdictionId,
    d.fireDistrict,
  );
  if (!jurisdiction.ok) return { ok: false, error: jurisdiction.error };

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
      jurisdictionId: jurisdiction.jurisdictionId,
      fireDistrict: jurisdiction.fireDistrict,
      permitNumber: d.permitNumber || null,
      permitExpiresAt,
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

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = addBuildingNoteSchema.safeParse({
    buildingId: formData.get("buildingId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getBuildingById(session, parsed.data.buildingId);
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
