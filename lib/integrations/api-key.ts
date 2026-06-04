import { createHash, randomBytes } from "node:crypto";
import { API_KEY_PREFIX } from "@/lib/integrations/constants";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey, "utf8").digest("hex");
}

export function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `${API_KEY_PREFIX}${secret}`;
  const keyPrefix = rawKey.slice(0, 16);
  return { rawKey, keyPrefix, keyHash: hashApiKey(rawKey) };
}

export function extractBearerOrApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization")?.trim();
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    return token || null;
  }
  const header = request.headers.get("x-api-key")?.trim();
  return header || null;
}
