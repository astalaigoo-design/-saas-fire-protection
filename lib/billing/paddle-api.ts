import { z } from "zod";

export type PaddlePortalIntent = "overview" | "cancel" | "update_payment";

const portalSessionSchema = z.object({
  data: z.object({
    urls: z.object({
      general: z.object({
        overview: z.string().url(),
      }),
      subscriptions: z
        .array(
          z.object({
            id: z.string(),
            cancel_subscription: z.string().url().optional(),
            update_subscription_payment_method: z.string().url().optional(),
          }),
        )
        .optional(),
    }),
  }),
});

export type PaddlePortalSession = z.infer<typeof portalSessionSchema>["data"];

export function getPaddleApiKey(): string | null {
  const key = process.env.PADDLE_API_KEY?.trim();
  return key || null;
}

export function isPaddlePortalApiConfigured(): boolean {
  return Boolean(getPaddleApiKey());
}

/** Sandbox vs live — must match the API key environment. */
export function getPaddleApiBaseUrl(): string {
  const key = getPaddleApiKey() ?? "";
  if (key.includes("_sdbx_")) {
    return "https://sandbox-api.paddle.com";
  }
  return "https://api.paddle.com";
}

export function resolvePortalUrlFromSession(
  session: PaddlePortalSession,
  subscriptionId: string,
  intent: PaddlePortalIntent,
): string | null {
  if (intent === "overview") {
    return session.urls.general.overview;
  }

  const subscription = session.urls.subscriptions?.find((row) => row.id === subscriptionId);
  if (!subscription) return null;

  if (intent === "cancel") {
    return subscription.cancel_subscription ?? session.urls.general.overview;
  }

  return (
    subscription.update_subscription_payment_method ?? session.urls.general.overview
  );
}

export async function createPaddleCustomerPortalSession(input: {
  customerId: string;
  subscriptionIds: string[];
}): Promise<
  | { ok: true; session: PaddlePortalSession }
  | { ok: false; error: string }
> {
  const apiKey = getPaddleApiKey();
  if (!apiKey) {
    return { ok: false, error: "Paddle API key is not configured." };
  }

  const response = await fetch(
    `${getPaddleApiBaseUrl()}/customers/${encodeURIComponent(input.customerId)}/portal-sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_ids: input.subscriptionIds,
      }),
      cache: "no-store",
    },
  );

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "detail" in payload.error &&
      typeof payload.error.detail === "string"
        ? payload.error.detail
        : `Paddle portal session failed (${response.status}).`;
    return { ok: false, error: message };
  }

  const parsed = portalSessionSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Unexpected Paddle portal session response." };
  }

  return { ok: true, session: parsed.data.data };
}
