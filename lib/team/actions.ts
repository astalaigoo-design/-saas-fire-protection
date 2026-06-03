"use server";

import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { createTeamInvitation } from "@/lib/clerk/create-team-invitation";
import { syncClerkPublicMetadata } from "@/lib/clerk/sync-public-metadata";
import { getDefaultBranchId } from "@/lib/branches/default-branch";
import { requiresAssignedBranch } from "@/lib/branches/user-branch";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";
import {
  inviteTeamMemberSchema,
  isInvitableTeamRole,
} from "@/lib/team/invite-schemas";
import { reassignTeamMemberBranchSchema } from "@/lib/team/reassign-branch-schema";

export type InviteTeamMemberState =
  | { ok: true; email: string }
  | { ok: false; error: string };

export async function inviteTeamMember(
  _prev: InviteTeamMemberState | undefined,
  formData: FormData,
): Promise<InviteTeamMemberState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can invite team members." };
  }

  const roleInput = String(formData.get("role") ?? "technician");
  const parsed = inviteTeamMemberSchema.safeParse({
    email: formData.get("email"),
    role: isInvitableTeamRole(roleInput) ? roleInput : "technician",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error: message };
  }

  const email = parsed.data.email.toLowerCase();

  if (session.email?.toLowerCase() === email) {
    return { ok: false, error: "You are already signed in with this email." };
  }

  const existingMember = await prisma.user.findFirst({
    where: {
      companyId: session.companyId,
      active: true,
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existingMember) {
    return {
      ok: false,
      error: "Someone with this email is already on your team.",
    };
  }

  const branchIdRaw = String(formData.get("branchId") ?? "").trim();
  let branchId: string;
  if (branchIdRaw) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchIdRaw, companyId: session.companyId },
      select: { id: true },
    });
    if (!branch) {
      return { ok: false, error: "Choose a valid branch for this invite." };
    }
    branchId = branch.id;
  } else {
    branchId = await getDefaultBranchId(session.companyId);
  }

  const invite = await createTeamInvitation({
    emailAddress: parsed.data.email,
    role: parsed.data.role,
    companyId: session.companyId,
    branchId,
  });

  if (!invite.ok) {
    return { ok: false, error: invite.error };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true, email: parsed.data.email };
}

export type ReassignTeamMemberBranchState =
  | { ok: true; branchName: string }
  | { ok: false; error: string };

export async function reassignTeamMemberBranch(
  _prev: ReassignTeamMemberBranchState | undefined,
  formData: FormData,
): Promise<ReassignTeamMemberBranchState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can change team branch assignments." };
  }

  const parsed = reassignTeamMemberBranchSchema.safeParse({
    userId: formData.get("userId"),
    branchId: formData.get("branchId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const member = await prisma.user.findFirst({
    where: {
      id: parsed.data.userId,
      companyId: session.companyId,
      active: true,
    },
    select: {
      id: true,
      role: true,
      branchId: true,
      clerkUserId: true,
    },
  });

  if (!member) {
    return { ok: false, error: "Team member not found." };
  }

  if (!requiresAssignedBranch(member.role)) {
    return { ok: false, error: "Owners are company-wide and are not assigned to a branch." };
  }

  if (member.branchId === parsed.data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: parsed.data.branchId, companyId: session.companyId },
      select: { name: true },
    });
    return { ok: true, branchName: branch?.name ?? "Branch" };
  }

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, companyId: session.companyId },
    select: { id: true, name: true },
  });
  if (!branch) {
    return { ok: false, error: "Choose a valid branch." };
  }

  try {
    await prisma.user.update({
      where: { id: member.id },
      data: { branchId: branch.id },
    });

    const metadataSync = await syncClerkPublicMetadata(member.clerkUserId, {
      branchId: branch.id,
    });
    if (!metadataSync.ok) {
      console.error("reassignTeamMemberBranch: Clerk metadata sync failed", metadataSync.error);
    }
  } catch (error) {
    captureServerActionError("reassignTeamMemberBranch", error);
    return { ok: false, error: "Could not update branch assignment. Try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true, branchName: branch.name };
}
