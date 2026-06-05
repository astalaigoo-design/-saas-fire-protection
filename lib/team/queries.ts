import { clerkClient } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";
import type { DashboardSession } from "@/lib/dashboard/session";
import { getDefaultBranchId } from "@/lib/branches/default-branch";
import { prisma } from "@/lib/prisma";
import {
  readInviteBranchId,
  readInviteCompanyId,
  readInviteRole,
} from "@/lib/team/invite-metadata";
import {
  branchTeamScopeFromSession,
  pendingInviteVisibleToSession,
  teamMemberVisibleToSession,
} from "@/lib/team/branch-team-access";

export type TeamMemberRow = {
  id: string;
  clerkUserId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
};

export type PendingTeamInviteRow = {
  id: string;
  emailAddress: string;
  role: string;
  branchId: string | null;
  branchName: string | null;
  createdAt: Date;
};

export async function listTeamMembers(session: DashboardSession): Promise<TeamMemberRow[]> {
  const rows = await prisma.user.findMany({
    where: { companyId: session.companyId, active: true },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      branchId: true,
      branch: { select: { name: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return rows
    .filter((row) => teamMemberVisibleToSession(session, row))
    .map((row) => ({
      id: row.id,
      clerkUserId: row.clerkUserId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      branchId: row.branchId,
      branchName: row.branch?.name ?? (row.role === "owner" ? "All locations" : null),
    }));
}

export async function listPendingTeamInvites(
  session: DashboardSession,
): Promise<PendingTeamInviteRow[]> {
  const companyId = session.companyId;
  try {
    const client = await clerkClient();
    const response = await client.invitations.getInvitationList({
      status: "pending",
      limit: 100,
    });

    const companyInvites = response.data.filter(
      (invite) => readInviteCompanyId(invite.publicMetadata) === companyId,
    );

    const branchIds = new Set<string>();
    for (const invite of companyInvites) {
      const branchId = readInviteBranchId(invite.publicMetadata);
      if (branchId) branchIds.add(branchId);
    }

    const defaultBranchId = await getDefaultBranchId(companyId);
    if (defaultBranchId) branchIds.add(defaultBranchId);

    const branchNameById = new Map<string, string>();
    if (branchIds.size > 0) {
      const branches = await prisma.branch.findMany({
        where: { companyId, id: { in: Array.from(branchIds) } },
        select: { id: true, name: true },
      });
      for (const branch of branches) {
        branchNameById.set(branch.id, branch.name);
      }
    }

    const defaultBranchName = defaultBranchId
      ? (branchNameById.get(defaultBranchId) ?? null)
      : null;

    return companyInvites
      .map((invite) => {
      const role = readInviteRole(invite.publicMetadata);
      const branchId =
        role === "owner" ? null : (readInviteBranchId(invite.publicMetadata) ?? defaultBranchId);
      const branchName =
        role === "owner"
          ? null
          : branchId
            ? (branchNameById.get(branchId) ?? defaultBranchName)
            : defaultBranchName;

      return {
        id: invite.id,
        emailAddress: invite.emailAddress,
        role,
        branchId,
        branchName,
        createdAt: new Date(invite.createdAt),
      };
    })
      .filter((invite) => pendingInviteVisibleToSession(session, invite));
  } catch (error) {
    console.error("listPendingTeamInvites failed", error);
    return [];
  }
}

export type TeamManagementData = {
  members: TeamMemberRow[];
  pendingInvites: PendingTeamInviteRow[];
  scope: ReturnType<typeof branchTeamScopeFromSession>;
};

export async function getTeamManagementData(
  session: DashboardSession,
): Promise<TeamManagementData> {
  const [members, pendingInvites] = await Promise.all([
    listTeamMembers(session),
    listPendingTeamInvites(session),
  ]);
  return {
    members,
    pendingInvites,
    scope: branchTeamScopeFromSession(session),
  };
}
