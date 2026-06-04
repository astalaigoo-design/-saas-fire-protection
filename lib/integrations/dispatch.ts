import type { IntegrationWebhookEvent } from "@prisma/client";
import { WEBHOOK_EVENT_WIRE } from "@/lib/integrations/constants";
import { signWebhookBody, WEBHOOK_SIGNATURE_HEADER } from "@/lib/integrations/sign-webhook";
import { prisma } from "@/lib/prisma";

const DELIVERY_TIMEOUT_MS = 8_000;

export async function dispatchCompanyWebhooks(input: {
  companyId: string;
  event: IntegrationWebhookEvent;
  data: Record<string, unknown>;
}): Promise<void> {
  const endpoints = await prisma.companyWebhookEndpoint.findMany({
    where: {
      companyId: input.companyId,
      active: true,
      events: { has: input.event },
    },
    select: { id: true, url: true, secret: true },
  });
  if (endpoints.length === 0) return;

  const body = JSON.stringify({
    event: WEBHOOK_EVENT_WIRE[input.event],
    occurredAt: new Date().toISOString(),
    data: input.data,
  });

  for (const endpoint of endpoints) {
    void deliverWebhook(endpoint.url, endpoint.secret, body).catch((error) => {
      console.error("webhook delivery failed", {
        endpointId: endpoint.id,
        event: input.event,
        error,
      });
    });
  }
}

export async function deliverWebhookToEndpoint(
  endpointId: string,
  companyId: string,
  event: IntegrationWebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const endpoint = await prisma.companyWebhookEndpoint.findFirst({
    where: { id: endpointId, companyId, active: true },
    select: { url: true, secret: true },
  });
  if (!endpoint) throw new Error("Webhook endpoint not found.");

  const body = JSON.stringify({
    event: WEBHOOK_EVENT_WIRE[event],
    occurredAt: new Date().toISOString(),
    data,
  });
  await deliverWebhook(endpoint.url, endpoint.secret, body);
}

async function deliverWebhook(url: string, secret: string, body: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WEBHOOK_SIGNATURE_HEADER]: signWebhookBody(secret, body),
        "User-Agent": "Flareflow-Webhooks/1",
      },
      body,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
