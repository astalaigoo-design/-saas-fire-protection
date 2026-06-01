import { InspectionItemResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  getChecklistSectionKey,
  getPendingItemIdsInSection,
  groupChecklistItemsBySection,
} from "@/lib/inspect/checklist-sections";

describe("getChecklistSectionKey", () => {
  it("reads NFPA standard from citation text", () => {
    expect(
      getChecklistSectionKey("NFPA 72 (2022) §14.3.1 — Control unit normal.", "Fire alarm"),
    ).toBe("nfpa-72");
    expect(
      getChecklistSectionKey("NFPA 25 (2023) §5.2.1 — Sprinkler heads clear.", "Sprinkler heads"),
    ).toBe("nfpa-25");
  });
});

describe("groupChecklistItemsBySection", () => {
  it("groups monthly walkthrough items by system", () => {
    const groups = groupChecklistItemsBySection([
      {
        id: "1",
        label: "Portable fire extinguishers accessible",
        description: "NFPA 10 (2022) §7.2.2.1.1 — Monthly inspection.",
        result: InspectionItemResult.pending,
      },
      {
        id: "2",
        label: "Sprinkler heads free of obstruction",
        description: "NFPA 25 (2023) §5.2.1 — Sprinklers clear.",
        result: InspectionItemResult.pending,
      },
      {
        id: "3",
        label: "Fire alarm control unit shows normal status",
        description: "NFPA 72 (2022) §14.3.1 — FACP normal.",
        result: InspectionItemResult.pass,
      },
    ]);

    expect(groups.map((g) => g.key)).toEqual(["nfpa-10", "nfpa-25", "nfpa-72"]);
    expect(groups[0]?.pendingCount).toBe(1);
    expect(groups[1]?.pendingCount).toBe(1);
    expect(groups[2]?.pendingCount).toBe(0);
  });
});

describe("getPendingItemIdsInSection", () => {
  it("returns only pending items in the requested section", () => {
    const items = [
      {
        id: "a",
        label: "Sprinkler heads",
        description: "NFPA 25 (2023) §5.2.1",
        result: InspectionItemResult.pending,
      },
      {
        id: "b",
        label: "Control valves",
        description: "NFPA 25 (2023) §5.2.6",
        result: InspectionItemResult.pass,
      },
      {
        id: "c",
        label: "Fire alarm FACP",
        description: "NFPA 72 (2022) §14.3.1",
        result: InspectionItemResult.pending,
      },
    ];

    expect(getPendingItemIdsInSection(items, "nfpa-25")).toEqual(["a"]);
  });
});
