"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canManageOrgSettings } from "@/lib/auth/permissions";
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

  await prisma.branch.create({
    data: {
      companyId: session.companyId,
      name: parsed.data.name,
      isDefault: false,
    },
  });

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
