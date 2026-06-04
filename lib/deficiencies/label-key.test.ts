import { describe, expect, it } from "vitest";
import { deficiencyLabelKey } from "@/lib/deficiencies/label-key";

describe("deficiencyLabelKey", () => {
  it("normalizes whitespace and case for re-inspection matching", () => {
    expect(deficiencyLabelKey("  Sprinkler   Heads  ")).toBe("sprinkler heads");
    expect(deficiencyLabelKey("Sprinkler heads")).toBe("sprinkler heads");
  });
});
