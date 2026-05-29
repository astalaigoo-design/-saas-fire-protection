import { syncClerkPublicMetadata } from "@/lib/clerk/sync-public-metadata";
import { parseClerkUserPayload } from "@/lib/clerk/webhook/parse-clerk-user";
import { resolveCompanyIdForClerkUser } from "@/lib/clerk/webhook/resolve-company";
import { prisma } from "@/lib/prisma";

export type WebhookHandlerResult =
  | { ok: true; action: string }
  | { ok: false; error: string; retryable?: boolean };

export async function handleUserCreated(data: unknown): Promise<WebhookHandlerResult> {
  const user = parseClerkUserPayload(data);
  if (!user) {
    return { ok: false, error: "Invalid user.created payload", retryable: false };
  }

  const companyResult = await resolveCompanyIdForClerkUser(user.companyIdFromMetadata, {
    userEmail: user.email,
    userName: user.name,
  });
  if ("error" in companyResult) {
    console.error("Clerk webhook user.created:", companyResult.error, user.clerkUserId);
    return { ok: false, error: companyResult.error, retryable: false };
  }

  try {
    await prisma.user.upsert({
      where: {
        companyId_clerkUserId: {
          companyId: companyResult.companyId,
          clerkUserId: user.clerkUserId,
        },
      },
      create: {
        companyId: companyResult.companyId,
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
        role: user.role,
        active: true,
        deletedAt: null,
      },
      update: {
        email: user.email,
        name: user.name,
        role: user.role,
        active: true,
        deletedAt: null,
      },
    });

    const metadataSync = await syncClerkPublicMetadata(user.clerkUserId, {
      role: user.role,
      companyId: companyResult.companyId,
    });
    if (!metadataSync.ok) {
      console.error(
        "Clerk webhook user.created: provisioned DB but metadata sync failed",
        metadataSync.error,
        user.clerkUserId,
      );
    }

    console.info("Clerk webhook user.created: provisioned", user.clerkUserId);
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
    const existing = await prisma.user.findMany({
      where: { clerkUserId: user.clerkUserId },
      select: { id: true, companyId: true },
    });

    if (existing.length === 0) {
      console.warn(
        "Clerk webhook user.updated: no local user, running create flow",
        user.clerkUserId,
      );
      return handleUserCreated(data);
    }

    await prisma.$transaction(
      existing.map((row) =>
        prisma.user.update({
          where: { id: row.id },
          data: {
            email: user.email,
            name: user.name,
            role: user.role,
            active: true,
            deletedAt: null,
          },
        }),
      ),
    );

    const primaryCompanyId = existing[0]?.companyId;
    if (primaryCompanyId) {
      const metadataSync = await syncClerkPublicMetadata(user.clerkUserId, {
        role: user.role,
        companyId: primaryCompanyId,
      });
      if (!metadataSync.ok) {
        console.error(
          "Clerk webhook user.updated: DB synced but metadata sync failed",
          metadataSync.error,
          user.clerkUserId,
        );
      }
    }

    console.info("Clerk webhook user.updated: synced", user.clerkUserId, existing.length);
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
