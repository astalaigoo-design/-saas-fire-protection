import type { AppRole } from "@/lib/auth/roles";
import type { Prisma } from "@prisma/client";

/** Who sees the in-app notification bell. */
export function canViewStaffNotifications(role: AppRole | null): boolean {
  return role === "owner" || role === "admin" || role === "technician";
}

export function staffNotificationWhereForUser(input: {
  companyId: string;
  appUserId: string;
  role: AppRole;
}): Prisma.StaffNotificationWhereInput {
  const base: Prisma.StaffNotificationWhereInput = {
    companyId: input.companyId,
  };

  if (input.role === "technician") {
    return { ...base, targetUserId: input.appUserId };
  }

  return {
    ...base,
    OR: [{ targetUserId: null }, { targetUserId: { not: null } }],
  };
}
