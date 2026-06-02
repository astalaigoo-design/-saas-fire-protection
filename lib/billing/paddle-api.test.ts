import { describe, expect, it, afterEach } from "vitest";
import {
  getPaddleApiBaseUrl,
  resolvePortalUrlFromSession,
  type PaddlePortalSession,
} from "@/lib/billing/paddle-api";

describe("getPaddleApiBaseUrl", () => {
  const original = process.env.PADDLE_API_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PADDLE_API_KEY;
    } else {
      process.env.PADDLE_API_KEY = original;
    }
  });

  it("uses sandbox host for sandbox API keys", () => {
    process.env.PADDLE_API_KEY = "pdl_sdbx_apikey_placeholder";
    expect(getPaddleApiBaseUrl()).toBe("https://sandbox-api.paddle.com");
  });

  it("uses live host for live API keys", () => {
    process.env.PADDLE_API_KEY = "pdl_live_apikey_placeholder";
    expect(getPaddleApiBaseUrl()).toBe("https://api.paddle.com");
  });
});

describe("resolvePortalUrlFromSession", () => {
  const session: PaddlePortalSession = {
    urls: {
      general: {
        overview: "https://customer-portal.paddle.com/cpl_test?action=overview&token=abc",
      },
      subscriptions: [
        {
          id: "sub_01test",
          cancel_subscription:
            "https://customer-portal.paddle.com/cpl_test?action=cancel_subscription&subscription_id=sub_01test&token=abc",
          update_subscription_payment_method:
            "https://customer-portal.paddle.com/cpl_test?action=update_subscription_payment_method&subscription_id=sub_01test&token=abc",
        },
      ],
    },
  };

  it("returns overview, cancel, and update payment deep links", () => {
    expect(resolvePortalUrlFromSession(session, "sub_01test", "overview")).toBe(
      session.urls.general.overview,
    );
    expect(resolvePortalUrlFromSession(session, "sub_01test", "cancel")).toContain(
      "cancel_subscription",
    );
    expect(resolvePortalUrlFromSession(session, "sub_01test", "update_payment")).toContain(
      "update_subscription_payment_method",
    );
  });
});
