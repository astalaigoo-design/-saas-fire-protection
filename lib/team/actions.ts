"use server";

import { revalidatePath } from "next/cache";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { createTeamInvitation } from "@/lib/clerk/create-team-invitation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";
import {
  inviteTeamMemberSchema,
  isInvitableTeamRole,
} from "@/lib/team/invite-schemas";

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

  const invite = await createTeamInvitation({
    emailAddress: parsed.data.email,
    role: parsed.data.role,
    companyId: session.companyId,
  });

  if (!invite.ok) {
    return { ok: false, error: invite.error };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true, email: parsed.data.email };
}
