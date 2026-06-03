export const BILLING_SUBSCRIBE_HASH = "subscribe";

export function billingSubscribePath(): string {
  return `/dashboard/billing#${BILLING_SUBSCRIBE_HASH}`;
}

export function canShowSubscribeCta(input: {
  checkoutUrl: string | null;
  inlineCheckoutReady: boolean;
  designPartner: boolean;
  canManage: boolean;
}): boolean {
  if (!input.canManage || input.designPartner) return false;
  return Boolean(input.checkoutUrl || input.inlineCheckoutReady);
}

export type SubscribePrimaryLink = {
  href: string;
  external: boolean;
  label: string;
};

export function resolveSubscribePrimaryLink(input: {
  checkoutUrl: string | null;
  inlineCheckoutReady: boolean;
  /** Shorter label when trial is ending vs access already expired. */
  urgent?: boolean;
}): SubscribePrimaryLink | null {
  const label = input.urgent ? "Subscribe now" : "Subscribe with Paddle";

  if (input.checkoutUrl) {
    return { href: input.checkoutUrl, external: true, label };
  }

  if (input.inlineCheckoutReady) {
    return { href: billingSubscribePath(), external: false, label };
  }

  return null;
}
