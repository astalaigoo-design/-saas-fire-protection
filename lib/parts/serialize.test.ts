import { describe, expect, it } from "vitest";
import { serializePartRow } from "@/lib/parts/serialize";

describe("serializePartRow", () => {
  it("converts dates to ISO strings for client components", () => {
    const row = serializePartRow({
      id: "part_1",
      sku: "EXT-01",
      name: "Extinguisher",
      description: null,
      unitCents: 2500,
      quantityOnHand: 3,
      active: true,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
      updatedAt: new Date("2026-06-02T15:30:00.000Z"),
    });

    expect(row.createdAt).toBe("2026-06-01T12:00:00.000Z");
    expect(row.updatedAt).toBe("2026-06-02T15:30:00.000Z");
  });
});
