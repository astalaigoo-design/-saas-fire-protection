import {
  COMPANY_METADATA_KEY,
  ROLE_METADATA_KEY,
  type AppRole,
} from "@/lib/auth/roles";

export type ClerkPublicMetadataPatch = {
  role?: AppRole;
  companyId?: string;
};

export type SyncClerkPublicMetadataResult =
  | { ok: true }
  | { ok: false; error: string };

/** Merge role / companyId into Clerk public_metadata (server-side only). */
export async function syncClerkPublicMetadata(
  clerkUserId: string,
  patch: ClerkPublicMetadataPatch,
): Promise<SyncClerkPublicMetadataResult> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, error: "CLERK_SECRET_KEY is not configured" };
  }

  if (patch.role === undefined && patch.companyId === undefined) {
    return { ok: true };
  }

  const getResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!getResponse.ok) {
    const body = await getResponse.text();
    return { ok: false, error: `Clerk GET user failed (${getResponse.status}): ${body}` };
  }

  const existing = (await getResponse.json()) as {
    public_metadata?: Record<string, unknown>;
  };

  const public_metadata: Record<string, unknown> = {
    ...(existing.public_metadata ?? {}),
  };

  if (patch.role !== undefined) {
    public_metadata[ROLE_METADATA_KEY] = patch.role;
  }
  if (patch.companyId !== undefined) {
    public_metadata[COMPANY_METADATA_KEY] = patch.companyId;
  }

  const patchResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ public_metadata }),
  });

  if (!patchResponse.ok) {
    const body = await patchResponse.text();
    return { ok: false, error: `Clerk PATCH user failed (${patchResponse.status}): ${body}` };
  }

  return { ok: true };
}
