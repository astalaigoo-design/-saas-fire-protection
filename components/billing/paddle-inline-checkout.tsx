"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  CheckoutEventNames,
  initializePaddle,
  type Paddle,
} from "@paddle/paddle-js";
import {
  getPaddleClientToken,
  getPaddleEnvironment,
  getPaddlePriceId,
} from "@/lib/billing/paddle-env";

/** Class name passed to Paddle `frameTarget` (no leading dot). */
export const PADDLE_CHECKOUT_FRAME_CLASS = "paddle-checkout-frame";

const FRAME_STYLE =
  "width: 100%; min-width: 312px; min-height: 450px; background-color: var(--card); border: none; border-radius: 0.75rem;";

type PaddleInlineCheckoutProps = {
  companyId: string;
  customerEmail: string | null;
};

export function PaddleInlineCheckout({ companyId, customerEmail }: PaddleInlineCheckoutProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const paddleRef = useRef<Paddle | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const token = getPaddleClientToken();
    const priceId = getPaddlePriceId();
    const environment = getPaddleEnvironment();

    if (!token || !priceId || !environment) {
      setError("Checkout is not configured. Set Paddle client token and price ID.");
      setLoading(false);
      return;
    }

    if (!frameRef.current) {
      setError("Checkout container is not ready. Refresh and try again.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const paddleToken = token;
    const paddlePriceId = priceId;
    const paddleEnvironment = environment;

    const inlineSettings = {
      displayMode: "inline" as const,
      frameTarget: PADDLE_CHECKOUT_FRAME_CLASS,
      frameInitialHeight: 450,
      frameStyle: FRAME_STYLE,
      theme: "dark" as const,
    };

    async function init() {
      try {
        const paddle = await initializePaddle({
          token: paddleToken,
          environment: paddleEnvironment,
          checkout: { settings: inlineSettings },
          eventCallback: (event) => {
            if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
              window.location.reload();
            }
          },
        });

        if (cancelled || !frameRef.current) return;

        if (!paddle) {
          setError("Could not load Paddle checkout.");
          setLoading(false);
          return;
        }

        paddleRef.current = paddle;

        paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customData: { company_id: companyId },
          customer: customerEmail ? { email: customerEmail } : undefined,
          settings: inlineSettings,
        });
      } catch {
        if (!cancelled) {
          setError("Could not initialize checkout. Try again or contact support.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
      paddleRef.current?.Checkout.close();
      paddleRef.current = undefined;
    };
  }, [companyId, customerEmail]);

  return (
    <div className="paddle-checkout-host relative isolate overflow-hidden rounded-xl border border-border bg-card">
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Loading secure checkout…</p>
      ) : null}
      {error ? (
        <p role="alert" className="px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div
        ref={frameRef}
        className={`${PADDLE_CHECKOUT_FRAME_CLASS} min-h-[450px] w-full`}
      />
    </div>
  );
}
