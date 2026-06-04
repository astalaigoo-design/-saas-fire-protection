"use server";

import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { getDashboardSession } from "@/lib/dashboard/session";
import {
  getInspectionTypeTemplate,
  isKnownInspectionTypeTemplateCode,
} from "@/lib/inspections/inspection-type-templates";
import { ensureChecklistTemplateSeeded } from "@/lib/inspections/checklist-template-seed";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

export type EnableInspectionTypePackState =
  | { ok: true }
  | { ok: false; error: string };

export async function enableInspectionTypePack(
  _prev: EnableInspectionTypePackState | undefined,
  formData: FormData,
): Promise<EnableInspectionTypePackState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can manage inspection type packs." };
  }

  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  if (!isKnownInspectionTypeTemplateCode(code)) {
    return { ok: false, error: "Unknown inspection type template." };
  }

  const template = getInspectionTypeTemplate(code);
  if (!template || template.category !== "nfpa_pack") {
    return { ok: false, error: "This template cannot be enabled from settings." };
  }

  try {
    const inspectionType = await prisma.inspectionType.upsert({
      where: {
        companyId_code: { companyId: session.companyId, code: template.code },
      },
      update: { name: template.name },
      create: {
        companyId: session.companyId,
        code: template.code,
        name: template.name,
      },
      select: { id: true, code: true },
    });

    await ensureChecklistTemplateSeeded(inspectionType.id, inspectionType.code);

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/jobs/new");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    captureServerActionError("enableInspectionTypePack", error);
    return { ok: false, error: "Could not enable this inspection type. Please try again." };
  }
}
