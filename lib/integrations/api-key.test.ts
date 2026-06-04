import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey } from "@/lib/integrations/api-key";
import { API_KEY_PREFIX } from "@/lib/integrations/constants";

describe("generateApiKey", () => {
  it("produces stable prefix and hash", () => {
    const first = generateApiKey();
    expect(first.rawKey.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(first.keyPrefix).toBe(first.rawKey.slice(0, 16));
    expect(hashApiKey(first.rawKey)).toBe(first.keyHash);

    const second = generateApiKey();
    expect(second.rawKey).not.toBe(first.rawKey);
  });
});
