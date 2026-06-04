import { getClerkProvisioningInput } from "@/lib/dashboard/clerk-provisioning-input";
import {
  ensureUserMembership,
  type EnsureMembershipInput,
} from "@/lib/dashboard/resolve-membership";

export type ProvisionWorkspaceResult =
  | { ok: true; companyId: string; companyName: string }
  | { ok: false; error: string; userMessage: string };

function userMessageForError(error: string): string {
  if (error.includes("Failed to create a company")) {
    return "We could not create your workspace — the database may be updating. Wait a minute and try again.";
  }
  if (error.includes("Database error")) {
    return "A temporary database error occurred. Try again in a moment.";
  }
  if (error.includes("No active membership")) {
    return "Your sign-in is linked to a workspace you cannot access. We will try to fix this automatically — use Connect workspace below.";
  }
  return "We could not connect your account to a workspace yet. Use Connect workspace below or contact support.";
}

async function attemptProvision(
  input: EnsureMembershipInput,
): Promise<ProvisionWorkspaceResult> {
  const result = await ensureUserMembership(input);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      userMessage: userMessageForError(result.error),
    };
  }
  return {
    ok: true,
    companyId: result.membership.companyId,
    companyName: result.membership.company.name,
  };
}

/**
 * Provision (or re-link) the signed-in Clerk user in Postgres without waiting for the webhook.
 * Retries once without companyId metadata when the first attempt fails (stale invite metadata).
 */
export async function provisionUserWorkspace(): Promise<ProvisionWorkspaceResult> {
  const input = await getClerkProvisioningInput();
  if (!input) {
    return {
      ok: false,
      error: "Not signed in.",
      userMessage: "Sign in again to continue.",
    };
  }

  const first = await attemptProvision(input);
  if (first.ok) return first;

  if (input.companyIdFromMetadata) {
    console.warn(
      "provisionUserWorkspace: retrying without company metadata",
      input.clerkUserId,
      first.error,
    );
    const retry = await attemptProvision({
      ...input,
      companyIdFromMetadata: null,
    });
    if (retry.ok) return retry;
    return retry;
  }

  return first;
}
