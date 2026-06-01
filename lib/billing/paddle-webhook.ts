import { SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { readCompanyIdFromPaddleCustomData } from "@/lib/billing/paddle-custom-data";
import { prisma } from "@/lib/prisma";

const paddleWebhookSchema = z.object({
  event_type: z.string(),
  data: z
    .object({
      id: z.string(),
      status: z.string().optional(),
      customer_id: z.string().nullable().optional(),
      subscription_id: z.string().nullable().optional(),
      next_billed_at: z.string().nullable().optional(),
      current_billing_period: z
        .object({
          ends_at: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      scheduled_change: z
        .object({
          effective_at: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      custom_data: z.record(z.string(), z.unknown()).nullable().optional(),
    })
    .passthrough(),
});

export type PaddleWebhookResult =
  | { ok: true; action: string }
  | { ok: false; error: string; retryable?: boolean };

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapPaddleStatus(status: string | undefined): SubscriptionStatus {
  switch (status) {
    case "active":
      return SubscriptionStatus.active;
    case "trialing":
      return SubscriptionStatus.trialing;
    case "past_due":
      return SubscriptionStatus.past_due;
    case "canceled":
    case "cancelled":
      return SubscriptionStatus.cancelled;
    case "paused":
      return SubscriptionStatus.expired;
    default:
      return SubscriptionStatus.expired;
  }
}

async function findCompanyForWebhook(input: {
  companyId: string | null;
  subscriptionId: string | null;
}): Promise<{ id: string } | null> {
  if (input.companyId) {
    const byCustomData = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true },
    });
    if (byCustomData) return byCustomData;
  }

  if (!input.subscriptionId) return null;

  return prisma.company.findFirst({
    where: { paddleSubscriptionId: input.subscriptionId },
    select: { id: true },
  });
}

function subscriptionIdForEvent(eventType: string, data: { id: string; subscription_id?: string | null }) {
  return eventType.startsWith("subscription.") ? data.id : data.subscription_id ?? null;
}

export async function handlePaddleWebhook(payload: unknown): Promise<PaddleWebhookResult> {
  const parsed = paddleWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid Paddle payload." };
  }

  const { event_type: eventType, data } = parsed.data;
  const subscriptionId = subscriptionIdForEvent(eventType, data);
  const companyId = readCompanyIdFromPaddleCustomData(data.custom_data);
  const customerId = data.customer_id ?? null;
  const mappedStatus = mapPaddleStatus(data.status);
  const renewsAt =
    parseDate(data.next_billed_at) ??
    parseDate(data.current_billing_period?.ends_at) ??
    parseDate(data.scheduled_change?.effective_at);

  const company = await findCompanyForWebhook({ companyId, subscriptionId });
  if (!company) {
    console.error("Paddle webhook: company not found", {
      eventType,
      companyId,
      subscriptionId,
    });
    return { ok: false, error: "Company not found for webhook.", retryable: false };
  }

  switch (eventType) {
    case "subscription.created":
    case "subscription.activated":
    case "subscription.updated":
    case "subscription.resumed": {
      if (!subscriptionId) {
        return { ok: false, error: "Missing Paddle subscription id." };
      }

      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: mappedStatus,
          paddleCustomerId: customerId,
          paddleSubscriptionId: subscriptionId,
          subscriptionRenewsAt: renewsAt,
          ...(mappedStatus === SubscriptionStatus.active
            ? { trialEndsAt: null }
            : mappedStatus === SubscriptionStatus.trialing && renewsAt
              ? { trialEndsAt: renewsAt }
              : {}),
        },
      });
      return { ok: true, action: eventType };
    }
    case "subscription.past_due":
    case "transaction.payment_failed": {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: SubscriptionStatus.past_due,
          ...(customerId ? { paddleCustomerId: customerId } : {}),
          ...(subscriptionId ? { paddleSubscriptionId: subscriptionId } : {}),
          subscriptionRenewsAt: renewsAt,
        },
      });
      return { ok: true, action: eventType };
    }
    case "subscription.canceled":
    case "subscription.cancelled": {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: SubscriptionStatus.cancelled,
          ...(customerId ? { paddleCustomerId: customerId } : {}),
          ...(subscriptionId ? { paddleSubscriptionId: subscriptionId } : {}),
          subscriptionRenewsAt: renewsAt,
        },
      });
      return { ok: true, action: eventType };
    }
    case "subscription.paused": {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: SubscriptionStatus.expired,
          ...(customerId ? { paddleCustomerId: customerId } : {}),
          ...(subscriptionId ? { paddleSubscriptionId: subscriptionId } : {}),
          subscriptionRenewsAt: null,
        },
      });
      return { ok: true, action: eventType };
    }
    default:
      return { ok: true, action: "ignored" };
  }
}
