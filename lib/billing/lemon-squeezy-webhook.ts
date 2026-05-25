import { SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const lemonSqueezyWebhookSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    custom_data: z.record(z.string(), z.unknown()).optional(),
  }),
  data: z.object({
    id: z.string(),
    attributes: z.object({
      status: z.string(),
      customer_id: z.union([z.number(), z.string()]),
      renews_at: z.string().nullable().optional(),
      ends_at: z.string().nullable().optional(),
    }),
  }),
});

export type LemonSqueezyWebhookResult =
  | { ok: true; action: string }
  | { ok: false; error: string; retryable?: boolean };

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readCompanyId(customData: Record<string, unknown> | undefined): string | null {
  const raw = customData?.company_id;
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  if (typeof raw === "number") return String(raw);
  return null;
}

function mapLemonSqueezyStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active":
    case "on_trial":
      return SubscriptionStatus.active;
    case "past_due":
    case "unpaid":
      return SubscriptionStatus.past_due;
    case "cancelled":
      return SubscriptionStatus.cancelled;
    case "expired":
    case "paused":
      return SubscriptionStatus.expired;
    default:
      return SubscriptionStatus.expired;
  }
}

async function findCompanyForWebhook(input: {
  companyId: string | null;
  subscriptionId: string;
}): Promise<{ id: string } | null> {
  if (input.companyId) {
    const byCustomData = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true },
    });
    if (byCustomData) return byCustomData;
  }

  return prisma.company.findFirst({
    where: { lemonSqueezySubscriptionId: input.subscriptionId },
    select: { id: true },
  });
}

export async function handleLemonSqueezyWebhook(
  payload: unknown,
): Promise<LemonSqueezyWebhookResult> {
  const parsed = lemonSqueezyWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid Lemon Squeezy payload." };
  }

  const { meta, data } = parsed.data;
  const eventName = meta.event_name;
  const subscriptionId = data.id;
  const companyId = readCompanyId(meta.custom_data);
  const customerId = String(data.attributes.customer_id);
  const mappedStatus = mapLemonSqueezyStatus(data.attributes.status);
  const renewsAt =
    parseDate(data.attributes.renews_at) ?? parseDate(data.attributes.ends_at);

  const company = await findCompanyForWebhook({ companyId, subscriptionId });
  if (!company) {
    console.error("Lemon Squeezy webhook: company not found", {
      eventName,
      companyId,
      subscriptionId,
    });
    return { ok: false, error: "Company not found for webhook.", retryable: false };
  }

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_payment_success": {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: mappedStatus,
          lemonSqueezyCustomerId: customerId,
          lemonSqueezySubscriptionId: subscriptionId,
          subscriptionRenewsAt: renewsAt,
          ...(mappedStatus === SubscriptionStatus.active ? { trialEndsAt: null } : {}),
        },
      });
      return { ok: true, action: eventName };
    }
    case "subscription_payment_failed": {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: SubscriptionStatus.past_due,
          lemonSqueezyCustomerId: customerId,
          lemonSqueezySubscriptionId: subscriptionId,
          subscriptionRenewsAt: renewsAt,
        },
      });
      return { ok: true, action: eventName };
    }
    case "subscription_cancelled": {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: SubscriptionStatus.cancelled,
          lemonSqueezyCustomerId: customerId,
          lemonSqueezySubscriptionId: subscriptionId,
          subscriptionRenewsAt: renewsAt,
        },
      });
      return { ok: true, action: eventName };
    }
    case "subscription_expired": {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: SubscriptionStatus.expired,
          lemonSqueezyCustomerId: customerId,
          lemonSqueezySubscriptionId: subscriptionId,
          subscriptionRenewsAt: null,
        },
      });
      return { ok: true, action: eventName };
    }
    default:
      return { ok: true, action: "ignored" };
  }
}
