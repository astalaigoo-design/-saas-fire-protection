"use server";

import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { updateCompanyProfileSchema } from "@/lib/companies/schemas";
import { getDashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type UpdateCompanyProfileState =
  | { ok: true }
  | { ok: false; error: string };

function formDataToObject(formData: FormData): Record<string, string> {
  return {
    name: String(formData.get("name") ?? ""),
    reportEmail: String(formData.get("reportEmail") ?? ""),
    reportPhone: String(formData.get("reportPhone") ?? ""),
    reportAddress: String(formData.get("reportAddress") ?? ""),
  };
}

export async function updateCompanyProfile(
  _prev: UpdateCompanyProfileState | undefined,
  formData: FormData,
): Promise<UpdateCompanyProfileState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can update organization settings." };
  }

  const parsed = updateCompanyProfileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error: message };
  }

  try {
    await prisma.company.update({
      where: { id: session.companyId },
      data: {
        name: parsed.data.name,
        reportEmail: parsed.data.reportEmail || null,
        reportPhone: parsed.data.reportPhone || null,
        reportAddress: parsed.data.reportAddress || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (error) {
    console.error("updateCompanyProfile failed", error);
    return { ok: false, error: "Could not save settings. Please try again." };
  }
}
