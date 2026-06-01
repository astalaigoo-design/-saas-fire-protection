import { clerkClient } from "@clerk/nextjs/server";
import {
  COMPANY_METADATA_KEY,
  ROLE_METADATA_KEY,
  type AppRole,
} from "@/lib/auth/roles";
import { getAppOrigin } from "@/lib/app-url";

export type CreateTeamInvitationResult =
  | { ok: true; invitationId: string }
  | { ok: false; error: string };

function clerkErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors: { message?: string; long_message?: string }[] })
      .errors;
    const first = errors[0];
    if (first?.long_message) return first.long_message;
    if (first?.message) return first.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Could not send invitation. Try again or contact support.";
}

/** Clerk application invite with role + companyId in public metadata (applied on sign-up). */
export async function createTeamInvitation(input: {
  emailAddress: string;
  role: AppRole;
  companyId: string;
}): Promise<CreateTeamInvitationResult> {
  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: input.emailAddress,
      redirectUrl: `${getAppOrigin()}/sign-up`,
      publicMetadata: {
        [ROLE_METADATA_KEY]: input.role,
        [COMPANY_METADATA_KEY]: input.companyId,
      },
      notify: true,
    });

    return { ok: true, invitationId: invitation.id };
  } catch (error) {
    console.error("createTeamInvitation failed", error);
    return { ok: false, error: clerkErrorMessage(error) };
  }
}
