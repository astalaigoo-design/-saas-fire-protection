import { clerkClient } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";
import { COMPANY_METADATA_KEY } from "@/lib/auth/roles";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type TeamMemberRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
};

export type PendingTeamInviteRow = {
  id: string;
  emailAddress: string;
  role: string;
  createdAt: Date;
};

function readInviteCompanyId(publicMetadata: unknown): string | null {
  if (!publicMetadata || typeof publicMetadata !== "object") return null;
  const raw = (publicMetadata as Record<string, unknown>)[COMPANY_METADATA_KEY];
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

function readInviteRole(publicMetadata: unknown): string {
  if (!publicMetadata || typeof publicMetadata !== "object") return "technician";
  const raw = (publicMetadata as Record<string, unknown>).role;
  return typeof raw === "string" ? raw : "technician";
}

export async function listTeamMembers(session: DashboardSession): Promise<TeamMemberRow[]> {
  return prisma.user.findMany({
    where: { companyId: session.companyId, active: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export async function listPendingTeamInvites(
  companyId: string,
): Promise<PendingTeamInviteRow[]> {
  try {
    const client = await clerkClient();
    const response = await client.invitations.getInvitationList({
      status: "pending",
      limit: 100,
    });

    return response.data
      .filter((invite) => readInviteCompanyId(invite.publicMetadata) === companyId)
      .map((invite) => ({
        id: invite.id,
        emailAddress: invite.emailAddress,
        role: readInviteRole(invite.publicMetadata),
        createdAt: new Date(invite.createdAt),
      }));
  } catch (error) {
    console.error("listPendingTeamInvites failed", error);
    return [];
  }
}

export type TeamManagementData = {
  members: TeamMemberRow[];
  pendingInvites: PendingTeamInviteRow[];
};

export async function getTeamManagementData(
  session: DashboardSession,
): Promise<TeamManagementData> {
  const [members, pendingInvites] = await Promise.all([
    listTeamMembers(session),
    listPendingTeamInvites(session.companyId),
  ]);
  return { members, pendingInvites };
}
