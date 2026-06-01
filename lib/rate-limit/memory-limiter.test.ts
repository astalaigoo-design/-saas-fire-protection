import { describe, expect, it, beforeEach } from "vitest";
import {
  memorySlidingWindowLimit,
  resetMemoryRateLimitStore,
} from "@/lib/rate-limit/memory-limiter";

describe("memorySlidingWindowLimit", () => {
  beforeEach(() => {
    resetMemoryRateLimitStore();
  });

  it("allows requests under the limit", () => {
    const first = memorySlidingWindowLimit({
      namespace: "test",
      key: "a",
      limit: 2,
      window: "1 m",
    });
    const second = memorySlidingWindowLimit({
      namespace: "test",
      key: "a",
      limit: 2,
      window: "1 m",
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("blocks when the limit is exceeded", () => {
    memorySlidingWindowLimit({ namespace: "test", key: "b", limit: 1, window: "1 m" });
    const blocked = memorySlidingWindowLimit({
      namespace: "test",
      key: "b",
      limit: 1,
      window: "1 m",
    });

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
