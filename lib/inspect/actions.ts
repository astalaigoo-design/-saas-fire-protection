"use server";

import {
  InspectionItemResult,
  InspectionStatus,
  type Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canViewAllJobs } from "@/lib/auth/permissions";
import { getDashboardSession } from "@/lib/dashboard/session";
import { isInspectionLocked } from "@/lib/inspect/queries";
import {
  submitInspectionSchema,
  updateChecklistItemSchema,
  uploadPhotoSchema,
} from "@/lib/inspect/schemas";
import { isSupabaseStorageConfigured } from "@/lib/supabase/env";
import {
  deleteInspectionPhotoFromStorage,
  uploadInspectionPhotoToStorage,
} from "@/lib/supabase/inspection-photos";
import { syncBuildingComplianceStatus } from "@/lib/buildings/sync-compliance";
import { prisma } from "@/lib/prisma";

export type InspectActionResult =
  | { ok: true }
  | { ok: false; error: string };

type EditableInspection = Prisma.InspectionGetPayload<{
  include: { items: true };
}>;

type LoadEditableResult =
  | { ok: true; inspection: EditableInspection }
  | { ok: false; error: string };

async function loadEditableInspection(
  inspectionId: string,
  session: NonNullable<Awaited<ReturnType<typeof getDashboardSession>>>,
): Promise<LoadEditableResult> {
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      companyId: session.companyId,
      ...(canViewAllJobs(session.role)
        ? {}
        : { assignedToUserId: session.appUserId }),
    },
    include: { items: true },
  });

  if (!inspection) {
    return { ok: false, error: "Inspection not found." };
  }
  if (isInspectionLocked(inspection)) {
    return { ok: false, error: "This inspection is locked and cannot be edited." };
  }

  return { ok: true, inspection };
}

export async function startInspection(
  inspectionId: string,
): Promise<InspectActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };

  const loaded = await loadEditableInspection(inspectionId, session);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  if (loaded.inspection.status === InspectionStatus.scheduled) {
    await prisma.inspection.update({
      where: { id: inspectionId },
      data: { status: InspectionStatus.in_progress },
    });
    await syncBuildingComplianceStatus(loaded.inspection.buildingId);
    revalidatePath(`/inspect/${inspectionId}`);
  }

  return { ok: true };
}

export async function updateChecklistItem(
  input: unknown,
): Promise<InspectActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };

  const parsed = updateChecklistItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (parsed.data.result === InspectionItemResult.fail && !parsed.data.notes) {
    return { ok: false, error: "Add a note explaining the failure." };
  }

  const loaded = await loadEditableInspection(parsed.data.inspectionId, session);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const item = loaded.inspection.items.find((row) => row.id === parsed.data.itemId);
  if (!item) return { ok: false, error: "Checklist item not found." };

  await prisma.inspectionItem.update({
    where: { id: parsed.data.itemId },
    data: {
      result: parsed.data.result,
      notes:
        parsed.data.result === InspectionItemResult.fail
          ? parsed.data.notes ?? null
          : null,
    },
  });

  if (loaded.inspection.status === InspectionStatus.scheduled) {
    await prisma.inspection.update({
      where: { id: parsed.data.inspectionId },
      data: { status: InspectionStatus.in_progress },
    });
  }

  revalidatePath(`/inspect/${parsed.data.inspectionId}`);
  return { ok: true };
}

export async function uploadInspectionPhoto(
  input: unknown,
): Promise<InspectActionResult & { photoId?: string; url?: string }> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };

  const parsed = uploadPhotoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid photo." };
  }

  const loaded = await loadEditableInspection(parsed.data.inspectionId, session);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  try {
    let photoUrl: string;
    if (isSupabaseStorageConfigured()) {
      const uploaded = await uploadInspectionPhotoToStorage({
        companyId: session.companyId,
        inspectionId: parsed.data.inspectionId,
        dataUrl: parsed.data.dataUrl,
      });
      photoUrl = uploaded.publicUrl;
    } else {
      photoUrl = parsed.data.dataUrl;
    }

    const count = await prisma.photo.count({
      where: { inspectionId: parsed.data.inspectionId },
    });

    const photo = await prisma.photo.create({
      data: {
        inspectionId: parsed.data.inspectionId,
        url: photoUrl,
        caption: parsed.data.caption ?? null,
        sortOrder: count,
      },
    });

    revalidatePath(`/inspect/${parsed.data.inspectionId}`);
    return { ok: true, photoId: photo.id, url: photo.url };
  } catch (error) {
    console.error("uploadInspectionPhoto failed", error);
    const message =
      error instanceof Error ? error.message : "Could not upload photo.";
    return { ok: false, error: message };
  }
}

export async function deleteInspectionPhoto(
  inspectionId: string,
  photoId: string,
): Promise<InspectActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };

  const loaded = await loadEditableInspection(inspectionId, session);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, inspectionId },
  });
  if (!photo) return { ok: false, error: "Photo not found." };

  try {
    if (isSupabaseStorageConfigured()) {
      await deleteInspectionPhotoFromStorage(photo.url);
    }
    await prisma.photo.delete({ where: { id: photoId } });
    revalidatePath(`/inspect/${inspectionId}`);
    return { ok: true };
  } catch (error) {
    console.error("deleteInspectionPhoto failed", error);
    const message =
      error instanceof Error ? error.message : "Could not delete photo.";
    return { ok: false, error: message };
  }
}

export async function submitInspection(
  input: unknown,
): Promise<InspectActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };

  const parsed = submitInspectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }

  const loaded = await loadEditableInspection(parsed.data.inspectionId, session);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const pending = loaded.inspection.items.filter(
    (item) => item.result === InspectionItemResult.pending,
  );
  if (pending.length > 0) {
    return {
      ok: false,
      error: `Complete all checklist items (${pending.length} remaining).`,
    };
  }

  const failedWithoutNotes = loaded.inspection.items.filter(
    (item) =>
      item.result === InspectionItemResult.fail &&
      (!item.notes || item.notes.trim() === ""),
  );
  if (failedWithoutNotes.length > 0) {
    return { ok: false, error: "Every failed item needs a note." };
  }

  const now = new Date();
  await prisma.inspection.update({
    where: { id: parsed.data.inspectionId },
    data: {
      status: InspectionStatus.completed,
      completedAt: now,
      signedAt: now,
      signatureData: parsed.data.signatureData,
      submittedByUserId: session.appUserId,
    },
  });

  await syncBuildingComplianceStatus(loaded.inspection.buildingId);

  revalidatePath(`/inspect/${parsed.data.inspectionId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  return { ok: true };
}
