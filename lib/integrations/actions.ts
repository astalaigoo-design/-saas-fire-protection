"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { IntegrationWebhookEvent } from "@prisma/client";
import { z } from "zod";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { ALL_WEBHOOK_EVENTS } from "@/lib/integrations/constants";
import { deliverWebhookToEndpoint } from "@/lib/integrations/dispatch";
import { generateApiKey } from "@/lib/integrations/api-key";
import { getDashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

const webhookUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid HTTPS URL.")
  .refine(
    (url) => url.startsWith("https://") || /^http:\/\/localhost(:\d+)?\//i.test(url),
    "Webhook URL must use HTTPS (http://localhost allowed for testing).",
  );

const createApiKeySchema = z.object({
  label: z.string().trim().max(80).optional(),
});

const webhookEventSchema = z.enum([
  "inspection_completed",
  "report_finalized",
  "quote_updated",
  "deficiency_created",
]);

const createWebhookSchema = z.object({
  label: z.string().trim().max(80).optional(),
  url: webhookUrlSchema,
  events: z.array(webhookEventSchema).min(1, "Select at least one event."),
});

function parseWebhookEvents(formData: FormData): IntegrationWebhookEvent[] {
  const raw = formData.getAll("events");
  const events: IntegrationWebhookEvent[] = [];
  for (const value of raw) {
    if (typeof value !== "string") continue;
    if ((ALL_WEBHOOK_EVENTS as readonly string[]).includes(value)) {
      events.push(value as IntegrationWebhookEvent);
    }
  }
  return Array.from(new Set(events));
}

export type IntegrationActionResult =
  | { ok: true; rawKey?: string; webhookSecret?: string }
  | { ok: false; error: string };

async function requireOwnerSession() {
  const session = await getDashboardSession();
  if (!session) return { ok: false as const, error: "You must be signed in." };
  if (!canManageOrgSettings(session.role)) {
    return { ok: false as const, error: "Only the owner can manage integrations." };
  }
  return { ok: true as const, session };
}

export async function createCompanyApiKey(
  _prev: IntegrationActionResult | undefined,
  formData: FormData,
): Promise<IntegrationActionResult> {
  const gate = await requireOwnerSession();
  if (!gate.ok) return gate;

  const parsed = createApiKeySchema.safeParse({
    label: formData.get("label") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { rawKey, keyPrefix, keyHash } = generateApiKey();
  await prisma.companyApiKey.create({
    data: {
      companyId: gate.session.companyId,
      label: parsed.data.label?.trim() || "API key",
      keyPrefix,
      keyHash,
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true, rawKey };
}

export async function revokeCompanyApiKey(apiKeyId: string): Promise<IntegrationActionResult> {
  const gate = await requireOwnerSession();
  if (!gate.ok) return gate;

  const updated = await prisma.companyApiKey.updateMany({
    where: { id: apiKeyId, companyId: gate.session.companyId },
    data: { active: false },
  });
  if (updated.count === 0) return { ok: false, error: "API key not found." };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function createCompanyWebhook(
  _prev: IntegrationActionResult | undefined,
  formData: FormData,
): Promise<IntegrationActionResult> {
  const gate = await requireOwnerSession();
  if (!gate.ok) return gate;

  const events = parseWebhookEvents(formData);
  const parsed = createWebhookSchema.safeParse({
    label: formData.get("label") || undefined,
    url: formData.get("url"),
    events,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const webhookSecret = `whsec_${randomBytes(24).toString("base64url")}`;
  await prisma.companyWebhookEndpoint.create({
    data: {
      companyId: gate.session.companyId,
      label: parsed.data.label?.trim() || "Webhook",
      url: parsed.data.url,
      secret: webhookSecret,
      events: parsed.data.events,
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true, webhookSecret };
}

export async function deleteCompanyWebhook(webhookId: string): Promise<IntegrationActionResult> {
  const gate = await requireOwnerSession();
  if (!gate.ok) return gate;

  const deleted = await prisma.companyWebhookEndpoint.deleteMany({
    where: { id: webhookId, companyId: gate.session.companyId },
  });
  if (deleted.count === 0) return { ok: false, error: "Webhook not found." };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function toggleCompanyWebhook(
  webhookId: string,
  active: boolean,
): Promise<IntegrationActionResult> {
  const gate = await requireOwnerSession();
  if (!gate.ok) return gate;

  const updated = await prisma.companyWebhookEndpoint.updateMany({
    where: { id: webhookId, companyId: gate.session.companyId },
    data: { active },
  });
  if (updated.count === 0) return { ok: false, error: "Webhook not found." };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function sendTestWebhook(webhookId: string): Promise<IntegrationActionResult> {
  const gate = await requireOwnerSession();
  if (!gate.ok) return gate;

  try {
    await deliverWebhookToEndpoint(webhookId, gate.session.companyId, "inspection_completed", {
      test: true,
      message: "Flareflow test webhook — configure your endpoint to accept signed POSTs.",
    });
  } catch {
    return { ok: false, error: "Test delivery failed. Check the URL and try again." };
  }

  return { ok: true };
}
