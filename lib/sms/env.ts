export const OUTBOUND_SMS_NOT_CONFIGURED =
  "Outbound SMS (Twilio) is not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM.";

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_SMS_FROM?.trim(),
  );
}

export function getTwilioSmsFrom(): string | null {
  const from = process.env.TWILIO_SMS_FROM?.trim();
  return from || null;
}

export type SmsConfigStatus = {
  configured: boolean;
  fromNumber: string | null;
};

export function getSmsConfigStatus(): SmsConfigStatus {
  return {
    configured: isSmsConfigured(),
    fromNumber: getTwilioSmsFrom(),
  };
}
