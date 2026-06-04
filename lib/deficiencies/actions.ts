"use server";

import { DeficiencyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canManageJobs } from "@/lib/auth/permissions";
import {
  assignDeficiencySchema,
  updateDeficiencyDueSchema,
  updateDeficiencyStatusSchema,
} from "@/lib/deficiencies/schemas";
import { getDashboardSession } from "@/lib/dashboard/session";
import { parseDateInputValue } from "@/lib/scheduling/calendar";
import { writeAuditEvent } from "@/lib/audit/write-event";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type DeficiencyActionState =
  | { ok: true }
  | { ok: false; error: string };

function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

async function guardManager() {
  const session = await getDashboardSession();
  if (!session) return { ok: false as const, error: "You must be signed in." };
  if (!canManageJobs(session.role)) {
    return { ok: false as const, error: "You do not have permission to manage deficiencies." };
  }
  return { ok: true as const, session };
}

async function loadDeficiency(companyId: string, deficiencyId: string) {
  return prisma.deficiency.findFirst({
    where: { id: deficiencyId, companyId },
    select: { id: true, status: true, buildingId: true },
  });
}

function revalidateDeficiencyPaths(buildingId: string): void {
  revalidatePath("/dashboard/operations");
  revalidatePath(`/dashboard/buildings/${buildingId}`);
}

export async function assignDeficiency(
  _prev: DeficiencyActionState | undefined,
  formData: FormData,
): Promise<DeficiencyActionState> {
  const guard = await guardManager();
  if (!guard.ok) return guard;

  const parsed = assignDeficiencySchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const deficiency = await loadDeficiency(guard.session.companyId, parsed.data.deficiencyId);
  if (!deficiency) return { ok: false, error: "Deficiency not found." };
  if (deficiency.status === DeficiencyStatus.verified) {
    return { ok: false, error: "This deficiency is already verified." };
  }

  const assigneeId = parsed.data.assignedToUserId;
  if (assigneeId) {
    const user = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        companyId: guard.session.companyId,
        active: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!user) return { ok: false, error: "Selected assignee is not valid." };
  }

  try {
    let nextStatus = deficiency.status;
    if (assigneeId && deficiency.status === DeficiencyStatus.open) {
      nextStatus = DeficiencyStatus.owned;
    } else if (!assigneeId && deficiency.status === DeficiencyStatus.owned) {
      nextStatus = DeficiencyStatus.open;
    }

    await prisma.deficiency.update({
      where: { id: deficiency.id },
      data: {
        assignedToUserId: assigneeId ?? null,
        status: nextStatus,
      },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "deficiency.assigned",
      entityType: "deficiency",
      entityId: deficiency.id,
      metadata: {
        buildingId: deficiency.buildingId,
        assignedToUserId: assigneeId ?? null,
      },
    });

    revalidateDeficiencyPaths(deficiency.buildingId);
    return { ok: true };
  } catch (error) {
    captureServerActionError("assignDeficiency", error);
    return { ok: false, error: "Could not assign deficiency." };
  }
}

export async function updateDeficiencyDueDate(
  _prev: DeficiencyActionState | undefined,
  formData: FormData,
): Promise<DeficiencyActionState> {
  const guard = await guardManager();
  if (!guard.ok) return guard;

  const parsed = updateDeficiencyDueSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const deficiency = await loadDeficiency(guard.session.companyId, parsed.data.deficiencyId);
  if (!deficiency) return { ok: false, error: "Deficiency not found." };
  if (deficiency.status === DeficiencyStatus.verified) {
    return { ok: false, error: "Verified deficiencies cannot be edited." };
  }

  const dueAt = parseDateInputValue(parsed.data.dueDate);
  if (!dueAt) return { ok: false, error: "Enter a valid due date." };

  try {
    await prisma.deficiency.update({
      where: { id: deficiency.id },
      data: { dueAt },
    });
    revalidateDeficiencyPaths(deficiency.buildingId);
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateDeficiencyDueDate", error);
    return { ok: false, error: "Could not update due date." };
  }
}

export async function updateDeficiencyStatus(
  _prev: DeficiencyActionState | undefined,
  formData: FormData,
): Promise<DeficiencyActionState> {
  const guard = await guardManager();
  if (!guard.ok) return guard;

  const parsed = updateDeficiencyStatusSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const deficiency = await loadDeficiency(guard.session.companyId, parsed.data.deficiencyId);
  if (!deficiency) return { ok: false, error: "Deficiency not found." };

  const { status } = parsed.data;
  if (status === DeficiencyStatus.verified && deficiency.status !== DeficiencyStatus.resolved) {
    return {
      ok: false,
      error: "Mark resolved first, or verify via a passing re-inspection.",
    };
  }

  try {
    const now = new Date();
    const clearingResolution =
      status === DeficiencyStatus.open || status === DeficiencyStatus.owned;

    await prisma.deficiency.update({
      where: { id: deficiency.id },
      data: {
        status,
        resolvedAt:
          status === DeficiencyStatus.resolved
            ? now
            : clearingResolution
              ? null
              : undefined,
        resolvedNote:
          status === DeficiencyStatus.resolved
            ? (parsed.data.resolvedNote ?? null)
            : clearingResolution
              ? null
              : undefined,
        verifiedAt: status === DeficiencyStatus.verified ? now : undefined,
      },
    });

    await writeAuditEvent({
      companyId: guard.session.companyId,
      actorUserId: guard.session.appUserId,
      action: "deficiency.status_changed",
      entityType: "deficiency",
      entityId: deficiency.id,
      metadata: {
        buildingId: deficiency.buildingId,
        status,
      },
    });

    revalidateDeficiencyPaths(deficiency.buildingId);
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateDeficiencyStatus", error);
    return { ok: false, error: "Could not update status." };
  }
}
