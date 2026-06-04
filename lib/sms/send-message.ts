import { isSmsConfigured } from "@/lib/sms/env";

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

/** Low-level Twilio REST send (no SDK). */
export async function sendSmsMessage(input: {
  to: string;
  body: string;
}): Promise<SendSmsResult> {
  if (!isSmsConfigured()) {
    return { ok: false, error: "SMS is not configured." };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_SMS_FROM!.trim();

  const params = new URLSearchParams({
    To: input.to,
    From: from,
    Body: input.body,
  });

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const payload = (await response.json()) as { sid?: string; message?: string };

    if (!response.ok) {
      return {
        ok: false,
        error: payload.message ?? `Twilio error (${response.status})`,
      };
    }

    if (!payload.sid) {
      return { ok: false, error: "Twilio returned no message id." };
    }

    return { ok: true, sid: payload.sid };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMS send failed.";
    return { ok: false, error: message };
  }
}
