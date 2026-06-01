import { Webhook } from "svix";

export type ClerkSvixHeaders = {
  "svix-id": string;
  "svix-timestamp": string;
  "svix-signature": string;
};

/** Verifies Clerk webhook payload via Svix; returns parsed JSON on success. */
export function verifyClerkWebhookSignature(
  secret: string,
  payload: string,
  headers: ClerkSvixHeaders,
): unknown {
  const wh = new Webhook(secret);
  return wh.verify(payload, headers);
}

/** Build Svix headers for tests (same algorithm Clerk uses). */
export function signClerkWebhookPayload(
  secret: string,
  payload: string,
  msgId = "msg_test_123",
  timestamp: Date = new Date(),
): ClerkSvixHeaders {
  const wh = new Webhook(secret);
  const signature = wh.sign(msgId, timestamp, payload);
  return {
    "svix-id": msgId,
    "svix-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
    "svix-signature": signature,
  };
}
