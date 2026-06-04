"use server";

import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import {
  addChecklistTemplateItemSchema,
  checklistTemplateItemIdSchema,
  checklistTemplateTypeIdSchema,
  reorderChecklistTemplateItemSchema,
  updateChecklistTemplateItemSchema,
} from "@/lib/inspections/checklist-template-schemas";
import { replaceChecklistTemplateWithNfpa } from "@/lib/inspections/checklist-template-seed";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type ChecklistTemplateActionState =
  | { ok: true }
  | { ok: false; error: string };

function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

function revalidateChecklistTemplatePaths(): void {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/jobs/new");
}

async function assertTemplateItemForCompany(
  companyId: string,
  itemId: string,
): Promise<
  | { ok: true; item: { id: string; inspectionTypeId: string; sortOrder: number; hidden: boolean } }
  | { ok: false; error: string }
> {
  const item = await prisma.checklistTemplateItem.findFirst({
    where: {
      id: itemId,
      inspectionType: { companyId },
    },
    select: {
      id: true,
      inspectionTypeId: true,
      sortOrder: true,
      hidden: true,
    },
  });
  if (!item) {
    return { ok: false, error: "Checklist item not found." };
  }
  return { ok: true, item };
}

async function assertInspectionTypeForCompany(
  companyId: string,
  inspectionTypeId: string,
): Promise<
  | { ok: true; type: { id: string; code: string } }
  | { ok: false; error: string }
> {
  const type = await prisma.inspectionType.findFirst({
    where: { id: inspectionTypeId, companyId },
    select: { id: true, code: true },
  });
  if (!type) {
    return { ok: false, error: "Inspection type not found." };
  }
  return { ok: true, type };
}

async function guardOwnerSession(): Promise<
  | { ok: true; companyId: string }
  | { ok: false; error: string }
> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can edit checklist templates." };
  }
  return { ok: true, companyId: session.companyId };
}

export async function addChecklistTemplateItem(
  _prev: ChecklistTemplateActionState | undefined,
  formData: FormData,
): Promise<ChecklistTemplateActionState> {
  const guard = await guardOwnerSession();
  if (!guard.ok) return guard;

  const parsed = addChecklistTemplateItemSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const typeCheck = await assertInspectionTypeForCompany(
    guard.companyId,
    parsed.data.inspectionTypeId,
  );
  if (!typeCheck.ok) return typeCheck;

  try {
    const maxOrder = await prisma.checklistTemplateItem.aggregate({
      where: { inspectionTypeId: typeCheck.type.id },
      _max: { sortOrder: true },
    });
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    await prisma.checklistTemplateItem.create({
      data: {
        inspectionTypeId: typeCheck.type.id,
        label: parsed.data.label,
        description: parsed.data.description ?? null,
        linkedTagNumber: parsed.data.linkedTagNumber ?? null,
        sortOrder: nextOrder,
        hidden: false,
      },
    });

    revalidateChecklistTemplatePaths();
    return { ok: true };
  } catch (error) {
    captureServerActionError("addChecklistTemplateItem", error);
    return { ok: false, error: "Could not add checklist item." };
  }
}

export async function updateChecklistTemplateItem(
  _prev: ChecklistTemplateActionState | undefined,
  formData: FormData,
): Promise<ChecklistTemplateActionState> {
  const guard = await guardOwnerSession();
  if (!guard.ok) return guard;

  const parsed = updateChecklistTemplateItemSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const itemCheck = await assertTemplateItemForCompany(guard.companyId, parsed.data.itemId);
  if (!itemCheck.ok) return itemCheck;

  try {
    await prisma.checklistTemplateItem.update({
      where: { id: parsed.data.itemId },
      data: {
        label: parsed.data.label,
        description: parsed.data.description ?? null,
        linkedTagNumber: parsed.data.linkedTagNumber ?? null,
      },
    });

    revalidateChecklistTemplatePaths();
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateChecklistTemplateItem", error);
    return { ok: false, error: "Could not update checklist item." };
  }
}

export async function toggleChecklistTemplateItemHidden(
  _prev: ChecklistTemplateActionState | undefined,
  formData: FormData,
): Promise<ChecklistTemplateActionState> {
  const guard = await guardOwnerSession();
  if (!guard.ok) return guard;

  const parsed = checklistTemplateItemIdSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const itemCheck = await assertTemplateItemForCompany(guard.companyId, parsed.data.itemId);
  if (!itemCheck.ok) return itemCheck;

  try {
    await prisma.checklistTemplateItem.update({
      where: { id: parsed.data.itemId },
      data: { hidden: !itemCheck.item.hidden },
    });

    revalidateChecklistTemplatePaths();
    return { ok: true };
  } catch (error) {
    captureServerActionError("toggleChecklistTemplateItemHidden", error);
    return { ok: false, error: "Could not update checklist item." };
  }
}

export async function reorderChecklistTemplateItem(
  _prev: ChecklistTemplateActionState | undefined,
  formData: FormData,
): Promise<ChecklistTemplateActionState> {
  const guard = await guardOwnerSession();
  if (!guard.ok) return guard;

  const parsed = reorderChecklistTemplateItemSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const itemCheck = await assertTemplateItemForCompany(guard.companyId, parsed.data.itemId);
  if (!itemCheck.ok) return itemCheck;

  try {
    const siblings = await prisma.checklistTemplateItem.findMany({
      where: { inspectionTypeId: itemCheck.item.inspectionTypeId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });

    const index = siblings.findIndex((row) => row.id === parsed.data.itemId);
    if (index < 0) {
      return { ok: false, error: "Checklist item not found." };
    }

    const swapIndex = parsed.data.direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) {
      return { ok: true };
    }

    const current = siblings[index];
    const neighbor = siblings[swapIndex];

    await prisma.$transaction([
      prisma.checklistTemplateItem.update({
        where: { id: current.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      prisma.checklistTemplateItem.update({
        where: { id: neighbor.id },
        data: { sortOrder: current.sortOrder },
      }),
    ]);

    revalidateChecklistTemplatePaths();
    return { ok: true };
  } catch (error) {
    captureServerActionError("reorderChecklistTemplateItem", error);
    return { ok: false, error: "Could not reorder checklist item." };
  }
}

export async function resetChecklistTemplateToDefaults(
  _prev: ChecklistTemplateActionState | undefined,
  formData: FormData,
): Promise<ChecklistTemplateActionState> {
  const guard = await guardOwnerSession();
  if (!guard.ok) return guard;

  const parsed = checklistTemplateTypeIdSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const typeCheck = await assertInspectionTypeForCompany(
    guard.companyId,
    parsed.data.inspectionTypeId,
  );
  if (!typeCheck.ok) return typeCheck;

  try {
    await replaceChecklistTemplateWithNfpa(typeCheck.type.id, typeCheck.type.code);
    revalidateChecklistTemplatePaths();
    return { ok: true };
  } catch (error) {
    captureServerActionError("resetChecklistTemplateToDefaults", error);
    return { ok: false, error: "Could not reset checklist template." };
  }
}
