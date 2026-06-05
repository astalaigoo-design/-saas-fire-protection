"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import {
  parseWaterSystemServiceIntervals,
  updateBranchDefaultsSchema,
} from "@/lib/branches/branch-defaults-schemas";
import { seedBranchWaterSystemIntervals, upsertBranchServiceIntervals } from "@/lib/assets/service-intervals";
import { BRANCH_COOKIE_NAME } from "@/lib/branches/constants";
import { ensureDefaultBranchForCompany } from "@/lib/branches/default-branch";
import { getDashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

const createBranchSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required.").max(80),
});

export type CreateBranchFormState =
  | { ok: true }
  | { ok: false; error: string };

export async function createBranch(
  _prev: CreateBranchFormState | undefined,
  formData: FormData,
): Promise<CreateBranchFormState> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can add branches." };
  }

  const parsed = createBranchSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const branch = await prisma.branch.create({
    data: {
      companyId: session.companyId,
      name: parsed.data.name,
      isDefault: false,
    },
    select: { id: true },
  });
  await seedBranchWaterSystemIntervals(branch.id);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setActiveBranch(branchId: string | null): Promise<void> {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  const cookieStore = await cookies();

  if (branchId === null || branchId === "") {
    cookieStore.delete(BRANCH_COOKIE_NAME);
    revalidatePath("/dashboard", "layout");
    return;
  }

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, companyId: session.companyId },
    select: { id: true },
  });
  if (!branch) return;

  cookieStore.set(BRANCH_COOKIE_NAME, branch.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
}

/** Called after company bootstrap so legacy rows without migration still work. */
export async function ensureCompanyHasDefaultBranch(companyId: string): Promise<string> {
  const branch = await ensureDefaultBranchForCompany(companyId);
  return branch.id;
}

export type UpdateBranchDefaultsState = { ok: true } | { ok: false; error: string };

export async function updateBranchDefaults(
  _prev: UpdateBranchDefaultsState | undefined,
  formData: FormData,
): Promise<UpdateBranchDefaultsState> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can update branch defaults." };
  }

  const parsed = updateBranchDefaultsSchema.safeParse({
    branchId: formData.get("branchId"),
    defaultAssetType: formData.get("defaultAssetType"),
    defaultServiceIntervalMonths: formData.get("defaultServiceIntervalMonths"),
    isImportDefault: formData.get("isImportDefault"),
    serviceInterval_fire_hydrant: formData.get("serviceInterval_fire_hydrant"),
    serviceInterval_standpipe: formData.get("serviceInterval_standpipe"),
    serviceInterval_sprinkler_component: formData.get("serviceInterval_sprinkler_component"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (parsed.data.defaultServiceIntervalMonths === "invalid") {
    return {
      ok: false,
      error: "Service interval must be a whole number between 1 and 60 months.",
    };
  }
  const waterSystemIntervals = parseWaterSystemServiceIntervals(parsed.data);
  if (waterSystemIntervals === "invalid") {
    return {
      ok: false,
      error: "Water system test intervals must be whole numbers between 1 and 60 months.",
    };
  }
  const defaultServiceIntervalMonths = parsed.data.defaultServiceIntervalMonths;

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, companyId: session.companyId },
    select: { id: true },
  });
  if (!branch) return { ok: false, error: "Branch not found." };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isImportDefault) {
      await tx.branch.updateMany({
        where: { companyId: session.companyId, id: { not: branch.id } },
        data: { isImportDefault: false },
      });
    }

    await tx.branch.update({
      where: { id: branch.id },
      data: {
        defaultAssetType: parsed.data.defaultAssetType,
        defaultServiceIntervalMonths,
        isImportDefault: parsed.data.isImportDefault,
      },
    });

    if (waterSystemIntervals.length > 0) {
      await upsertBranchServiceIntervals(branch.id, waterSystemIntervals, tx);
    }
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/buildings/import-equipment");
  revalidatePath("/dashboard/customers/import");
  revalidatePath("/dashboard/buildings/import");
  revalidatePath("/dashboard/jobs/import");
  return { ok: true };
}
