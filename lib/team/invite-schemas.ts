import { z } from "zod";

/** Roles an owner can assign via email invite (not owner). */
export const INVITABLE_TEAM_ROLES = ["admin", "technician"] as const;

export type InvitableTeamRole = (typeof INVITABLE_TEAM_ROLES)[number];

export function isInvitableTeamRole(value: string): value is InvitableTeamRole {
  return (INVITABLE_TEAM_ROLES as readonly string[]).includes(value);
}

export const inviteTeamMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(INVITABLE_TEAM_ROLES).default("technician"),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
