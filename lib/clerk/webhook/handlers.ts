import { syncClerkPublicMetadata } from "@/lib/clerk/sync-public-metadata";
import { parseClerkUserPayload } from "@/lib/clerk/webhook/parse-clerk-user";
import { ensureUserMembership } from "@/lib/dashboard/resolve-membership";
import { prisma } from "@/lib/prisma";

export type WebhookHandlerResult =
  | { ok: true; action: string }
  | { ok: false; error: string; retryable?: boolean };

export async function handleUserCreated(data: unknown): Promise<WebhookHandlerResult> {
  const user = parseClerkUserPayload(data);
  if (!user) {
    return { ok: false, error: "Invalid user.created payload", retryable: false };
  }

  try {
    const result = await ensureUserMembership({
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      companyIdFromMetadata: user.companyIdFromMetadata,
    });
    if (!result.ok) {
      console.error("Clerk webhook user.created:", result.error, user.clerkUserId);
      return { ok: false, error: result.error, retryable: false };
    }

    console.info(
      "Clerk webhook user.created: provisioned",
      user.clerkUserId,
      "companyId:",
      result.membership.companyId,
    );
    return { ok: true, action: "user.created" };
  } catch (error) {
    console.error("Clerk webhook user.created: database error", error, user.clerkUserId);
    return { ok: false, error: "Database error provisioning user", retryable: true };
  }
}

export async function handleUserUpdated(data: unknown): Promise<WebhookHandlerResult> {
  const user = parseClerkUserPayload(data);
  if (!user) {
    return { ok: false, error: "Invalid user.updated payload", retryable: false };
  }

  try {
    const result = await ensureUserMembership({
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      companyIdFromMetadata: user.companyIdFromMetadata,
    });
    if (!result.ok) {
      console.error("Clerk webhook user.updated:", result.error, user.clerkUserId);
      return { ok: false, error: result.error, retryable: false };
    }

    await prisma.user.updateMany({
      where: { clerkUserId: user.clerkUserId, active: true },
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    console.info(
      "Clerk webhook user.updated: synced",
      user.clerkUserId,
      "companyId:",
      result.membership.companyId,
    );
    return { ok: true, action: "user.updated" };
  } catch (error) {
    console.error("Clerk webhook user.updated: database error", error, user.clerkUserId);
    return { ok: false, error: "Database error updating user", retryable: true };
  }
}

export async function handleUserDeleted(data: unknown): Promise<WebhookHandlerResult> {
  const user = parseClerkUserPayload(data);
  if (!user) {
    return { ok: false, error: "Invalid user.deleted payload", retryable: false };
  }

  try {
    const result = await prisma.user.updateMany({
      where: { clerkUserId: user.clerkUserId, active: true },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });

    console.info(
      "Clerk webhook user.deleted: deactivated",
      user.clerkUserId,
      "rows:",
      result.count,
    );
    return { ok: true, action: "user.deleted" };
  } catch (error) {
    console.error("Clerk webhook user.deleted: database error", error, user.clerkUserId);
    return { ok: false, error: "Database error deactivating user", retryable: true };
  }
}

export async function dispatchClerkWebhookEvent(
  type: string,
  data: unknown,
): Promise<WebhookHandlerResult> {
  switch (type) {
    case "user.created":
      return handleUserCreated(data);
    case "user.updated":
      return handleUserUpdated(data);
    case "user.deleted":
      return handleUserDeleted(data);
    default:
      console.info("Clerk webhook: ignored event type", type);
      return { ok: true, action: `ignored:${type}` };
  }
}
