import { z } from "zod";
import {
  BRANCH_METADATA_KEY,
  COMPANY_METADATA_KEY,
  resolveAppRole,
  type AppRole,
} from "@/lib/auth/roles";

const emailAddressSchema = z.object({
  id: z.string(),
  email_address: z.string(),
});

const clerkUserDataSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email_addresses: z.array(emailAddressSchema).optional().default([]),
  primary_email_address_id: z.string().nullable().optional(),
  public_metadata: z.record(z.string(), z.unknown()).optional().default({}),
  unsafe_metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type ParsedClerkUser = {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: AppRole;
  companyIdFromMetadata: string | null;
  branchIdFromMetadata: string | null;
};

export function parseClerkUserPayload(data: unknown): ParsedClerkUser | null {
  const parsed = clerkUserDataSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Clerk webhook: invalid user payload", parsed.error.flatten());
    return null;
  }

  const user = parsed.data;
  const primary =
    user.email_addresses.find((e) => e.id === user.primary_email_address_id) ??
    user.email_addresses[0];

  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || null;

  const companyIdRaw = user.public_metadata[COMPANY_METADATA_KEY];
  const companyIdFromMetadata =
    typeof companyIdRaw === "string" && companyIdRaw.trim().length > 0
      ? companyIdRaw.trim()
      : null;

  const branchIdRaw = user.public_metadata[BRANCH_METADATA_KEY];
  const branchIdFromMetadata =
    typeof branchIdRaw === "string" && branchIdRaw.trim().length > 0
      ? branchIdRaw.trim()
      : null;

  return {
    clerkUserId: user.id,
    email: primary?.email_address ?? null,
    name,
    role: resolveAppRole(user.public_metadata, user.unsafe_metadata),
    companyIdFromMetadata,
    branchIdFromMetadata,
  };
}
