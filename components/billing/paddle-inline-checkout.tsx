"use client";

import { useEffect, useRef, useState } from "react";
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

const FRAME_CLASS = "paddle-checkout-frame";

type PaddleInlineCheckoutProps = {
  companyId: string;
  customerEmail: string | null;
};

export function PaddleInlineCheckout({ companyId, customerEmail }: PaddleInlineCheckoutProps) {
  const paddleRef = useRef<Paddle | undefined>();
  const openedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getPaddleClientToken();
    const priceId = getPaddlePriceId();
    const environment = getPaddleEnvironment();

    if (!token || !priceId || !environment) {
      setError("Checkout is not configured. Set Paddle client token and price ID.");
      setLoading(false);
      return;
    }

    const paddleToken = token;
    const paddlePriceId = priceId;
    const paddleEnvironment = environment;

    let cancelled = false;

    async function init() {
      try {
        const paddle = await initializePaddle({
          token: paddleToken,
          environment: paddleEnvironment,
          eventCallback: (event) => {
            if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
              window.location.reload();
            }
          },
        });

        if (cancelled) return;

        if (!paddle) {
          setError("Could not load Paddle checkout.");
          setLoading(false);
          return;
        }

        paddleRef.current = paddle;

        if (!openedRef.current) {
          openedRef.current = true;
          paddle.Checkout.open({
            items: [{ priceId: paddlePriceId, quantity: 1 }],
            customData: { company_id: companyId },
            customer: customerEmail ? { email: customerEmail } : undefined,
            settings: {
              displayMode: "inline",
              theme: "light",
              frameTarget: FRAME_CLASS,
              frameInitialHeight: 450,
            },
          });
        }
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
    };
  }, [companyId, customerEmail]);

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading secure checkout…</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className={FRAME_CLASS} />
    </div>
  );
}
