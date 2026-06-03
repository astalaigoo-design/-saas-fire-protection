import { describe, expect, it } from "vitest";
import {
  billingSubscribePath,
  canShowSubscribeCta,
  resolveSubscribePrimaryLink,
} from "@/lib/billing/subscribe-cta";

describe("subscribe-cta", () => {
  it("shows CTA when inline checkout is ready without hosted URL", () => {
    expect(
      canShowSubscribeCta({
        checkoutUrl: null,
        inlineCheckoutReady: true,
        designPartner: false,
        canManage: true,
      }),
    ).toBe(true);

    expect(
      resolveSubscribePrimaryLink({
        checkoutUrl: null,
        inlineCheckoutReady: true,
        urgent: true,
      }),
    ).toEqual({
      href: billingSubscribePath(),
      external: false,
      label: "Subscribe now",
    });
  });

  it("prefers hosted checkout URL when configured", () => {
    expect(
      resolveSubscribePrimaryLink({
        checkoutUrl: "https://checkout.paddle.com/c/abc",
        inlineCheckoutReady: true,
      }),
    ).toEqual({
      href: "https://checkout.paddle.com/c/abc",
      external: true,
      label: "Subscribe with Paddle",
    });
  });

  it("hides subscribe for design partners", () => {
    expect(
      canShowSubscribeCta({
        checkoutUrl: "https://checkout.paddle.com/c/abc",
        inlineCheckoutReady: true,
        designPartner: true,
        canManage: true,
      }),
    ).toBe(false);
  });
});
