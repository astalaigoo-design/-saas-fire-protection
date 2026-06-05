"use server";

import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { requireWritableTenant } from "@/lib/billing/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { upsertJurisdictionSchema } from "@/lib/jurisdictions/schemas";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export type JurisdictionActionResult = { ok: true } | { ok: false; error: string };

const updateCertificateSettingsSchema = z.object({
  certificateNumberPrefix: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value === "" ? null : value ?? null)),
});

export async function upsertJurisdiction(
  _prev: JurisdictionActionResult | undefined,
  formData: FormData,
): Promise<JurisdictionActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can manage jurisdictions." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = upsertJurisdictionSchema.safeParse({
    jurisdictionId: String(formData.get("jurisdictionId") ?? "").trim() || undefined,
    name: formData.get("name"),
    code: formData.get("code"),
    certificatePrefix: formData.get("certificatePrefix"),
    reportTemplateKey: formData.get("reportTemplateKey") || "default",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const jurisdictionId = parsed.data.jurisdictionId;

  try {
    if (jurisdictionId) {
      const existing = await prisma.jurisdiction.findFirst({
        where: { id: jurisdictionId, companyId: session.companyId },
        select: { id: true },
      });
      if (!existing) return { ok: false, error: "Jurisdiction not found." };

      await prisma.jurisdiction.update({
        where: { id: jurisdictionId },
        data: {
          name: parsed.data.name,
          code: parsed.data.code,
          certificatePrefix: parsed.data.certificatePrefix ?? null,
          reportTemplateKey: parsed.data.reportTemplateKey,
        },
      });
    } else {
      await prisma.jurisdiction.create({
        data: {
          companyId: session.companyId,
          name: parsed.data.name,
          code: parsed.data.code,
          certificatePrefix: parsed.data.certificatePrefix ?? null,
          reportTemplateKey: parsed.data.reportTemplateKey,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/buildings");
    return { ok: true };
  } catch (error) {
    captureServerActionError("upsertJurisdiction", error);
    return { ok: false, error: "Could not save jurisdiction. Code may already be in use." };
  }
}

export async function deleteJurisdiction(
  jurisdictionId: string,
): Promise<JurisdictionActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can manage jurisdictions." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const id = jurisdictionId.trim();
  if (!id) return { ok: false, error: "Jurisdiction is required." };

  try {
    const existing = await prisma.jurisdiction.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Jurisdiction not found." };

    await prisma.jurisdiction.delete({ where: { id } });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/buildings");
    return { ok: true };
  } catch (error) {
    captureServerActionError("deleteJurisdiction", error);
    return { ok: false, error: "Could not delete jurisdiction. Unassign buildings first." };
  }
}

export async function updateCertificateSettings(
  _prev: JurisdictionActionResult | undefined,
  formData: FormData,
): Promise<JurisdictionActionResult> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can update certificate settings." };
  }

  const tenant = await requireWritableTenant(session);
  if (!tenant.ok) return { ok: false, error: tenant.error };

  const parsed = updateCertificateSettingsSchema.safeParse({
    certificateNumberPrefix: formData.get("certificateNumberPrefix"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.company.update({
      where: { id: session.companyId },
      data: { certificateNumberPrefix: parsed.data.certificateNumberPrefix },
    });
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateCertificateSettings", error);
    return { ok: false, error: "Could not save certificate settings." };
  }
}
