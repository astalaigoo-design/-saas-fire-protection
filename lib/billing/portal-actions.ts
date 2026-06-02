"use server";

import { z } from "zod";
import { ensureCanManageBilling } from "@/lib/auth/guards";
import {
  createPaddleCustomerPortalSession,
  resolvePortalUrlFromSession,
  type PaddlePortalIntent,
} from "@/lib/billing/paddle-api";
import { getPaddleCustomerPortalUrl } from "@/lib/billing/queries";
import { getDashboardSession } from "@/lib/dashboard/session";
import { captureServerActionError } from "@/lib/monitoring/capture";
import { prisma } from "@/lib/prisma";

const intentSchema = z.enum(["overview", "cancel", "update_payment"]);

export type OpenPaddlePortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function openPaddlePortalAction(
  intentRaw: PaddlePortalIntent,
): Promise<OpenPaddlePortalResult> {
  const intentParsed = intentSchema.safeParse(intentRaw);
  if (!intentParsed.success) {
    return { ok: false, error: "Invalid portal action." };
  }
  const intent = intentParsed.data;

  const session = await getDashboardSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  try {
    ensureCanManageBilling(session.role);
  } catch {
    return { ok: false, error: "Only the company owner can manage billing." };
  }

  const company = await prisma.company.findFirst({
    where: { id: session.companyId },
    select: {
      paddleCustomerId: true,
      paddleSubscriptionId: true,
    },
  });

  if (!company) {
    return { ok: false, error: "Company not found." };
  }

  const fallbackUrl = getPaddleCustomerPortalUrl();
  if (
    intent === "overview" &&
    fallbackUrl &&
    (!company.paddleCustomerId || !company.paddleSubscriptionId)
  ) {
    return { ok: true, url: fallbackUrl };
  }

  if (!company.paddleCustomerId || !company.paddleSubscriptionId) {
    return {
      ok: false,
      error:
        "No Paddle subscription is linked yet. Subscribe first, then return here to manage billing.",
    };
  }

  try {
    const portalSession = await createPaddleCustomerPortalSession({
      customerId: company.paddleCustomerId,
      subscriptionIds: [company.paddleSubscriptionId],
    });

    if (!portalSession.ok) {
      if (intent === "overview" && fallbackUrl) {
        return { ok: true, url: fallbackUrl };
      }
      return portalSession;
    }

    const url = resolvePortalUrlFromSession(
      portalSession.session,
      company.paddleSubscriptionId,
      intent,
    );

    if (!url) {
      return {
        ok: false,
        error: "Could not create a customer portal link for this subscription.",
      };
    }

    return { ok: true, url };
  } catch (error) {
    captureServerActionError("openPaddlePortalAction", error);
    if (intent === "overview" && fallbackUrl) {
      return { ok: true, url: fallbackUrl };
    }
    return { ok: false, error: "Could not open the customer portal. Try again." };
  }
}
