"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { createTeamInvitation } from "@/lib/clerk/create-team-invitation";
import { getPendingInvitation } from "@/lib/clerk/get-pending-invitation";
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
import {
  readInviteBranchId,
  readInviteCompanyId,
  readInviteRole,
} from "@/lib/team/invite-metadata";
import { reassignPendingInviteBranchSchema } from "@/lib/team/reassign-pending-invite-schema";
import { reassignTeamMemberBranchSchema } from "@/lib/team/reassign-branch-schema";
import {
  updateMyPhoneSchema,
  updateTeamMemberPhoneSchema,
} from "@/lib/team/phone-schema";

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

export type ReassignPendingInviteBranchState =
  | { ok: true; branchName: string; email: string }
  | { ok: false; error: string };

export async function reassignPendingInviteBranch(
  _prev: ReassignPendingInviteBranchState | undefined,
  formData: FormData,
): Promise<ReassignPendingInviteBranchState> {
  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can change pending invitation branches." };
  }

  const parsed = reassignPendingInviteBranchSchema.safeParse({
    invitationId: formData.get("invitationId"),
    branchId: formData.get("branchId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const invite = await getPendingInvitation(parsed.data.invitationId);
  if (!invite) {
    return { ok: false, error: "Pending invitation not found." };
  }

  if (readInviteCompanyId(invite.publicMetadata) !== session.companyId) {
    return { ok: false, error: "Pending invitation not found." };
  }

  const role = readInviteRole(invite.publicMetadata);
  if (role === "owner") {
    return { ok: false, error: "Owners are company-wide and are not assigned to a branch." };
  }

  const invitableRole = isInvitableTeamRole(role) ? role : "technician";

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, companyId: session.companyId },
    select: { id: true, name: true },
  });
  if (!branch) {
    return { ok: false, error: "Choose a valid branch." };
  }

  const currentBranchId =
    readInviteBranchId(invite.publicMetadata) ?? (await getDefaultBranchId(session.companyId));
  if (currentBranchId === branch.id) {
    return { ok: true, branchName: branch.name, email: invite.emailAddress };
  }

  try {
    const client = await clerkClient();
    await client.invitations.revokeInvitation(parsed.data.invitationId);

    const recreated = await createTeamInvitation({
      emailAddress: invite.emailAddress,
      role: invitableRole,
      companyId: session.companyId,
      branchId: branch.id,
    });

    if (!recreated.ok) {
      return { ok: false, error: recreated.error };
    }
  } catch (error) {
    captureServerActionError("reassignPendingInviteBranch", error);
    return {
      ok: false,
      error: "Could not update the invitation branch. Try sending a new invite.",
    };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true, branchName: branch.name, email: invite.emailAddress };
}

export type UpdateTeamMemberPhoneState =
  | { ok: true }
  | { ok: false; error: string };

export async function updateTeamMemberPhone(
  _prev: UpdateTeamMemberPhoneState | undefined,
  formData: FormData,
): Promise<UpdateTeamMemberPhoneState> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!canManageOrgSettings(session.role)) {
    return { ok: false, error: "Only the owner can update team phone numbers." };
  }

  const parsed = updateTeamMemberPhoneSchema.safeParse({
    userId: formData.get("userId"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid phone." };
  }

  const member = await prisma.user.findFirst({
    where: { id: parsed.data.userId, companyId: session.companyId, active: true },
    select: { id: true, role: true },
  });
  if (!member) return { ok: false, error: "Team member not found." };
  if (member.role !== "technician") {
    return { ok: false, error: "SMS alerts apply to technicians only." };
  }

  try {
    await prisma.user.update({
      where: { id: member.id },
      data: { phone: parsed.data.phone },
    });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/my-jobs");
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateTeamMemberPhone", error);
    return { ok: false, error: "Could not save phone number." };
  }
}

export type UpdateMyPhoneState = { ok: true } | { ok: false; error: string };

export async function updateMyTechnicianPhone(
  _prev: UpdateMyPhoneState | undefined,
  formData: FormData,
): Promise<UpdateMyPhoneState> {
  const session = await getDashboardSession();
  if (!session) return { ok: false, error: "You must be signed in." };
  if (session.role !== "technician") {
    return { ok: false, error: "Only technicians can update this field here." };
  }

  const parsed = updateMyPhoneSchema.safeParse({
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid phone." };
  }

  try {
    await prisma.user.update({
      where: { id: session.appUserId },
      data: { phone: parsed.data.phone },
    });
    revalidatePath("/dashboard/my-jobs");
    return { ok: true };
  } catch (error) {
    captureServerActionError("updateMyTechnicianPhone", error);
    return { ok: false, error: "Could not save phone number." };
  }
}
