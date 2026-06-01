import { InspectionItemResult } from "@prisma/client";

export type ChecklistSectionKey =
  | "nfpa-10"
  | "nfpa-25"
  | "nfpa-72"
  | "nfpa-96"
  | "nfpa-101"
  | "other";

export type ChecklistItemSectionRef = {
  id: string;
  label: string;
  description: string | null;
  result: InspectionItemResult;
};

export type ChecklistSectionGroup = {
  key: ChecklistSectionKey;
  label: string;
  items: ChecklistItemSectionRef[];
  pendingCount: number;
  completedCount: number;
};

const SECTION_LABELS: Record<ChecklistSectionKey, string> = {
  "nfpa-10": "Portable extinguishers",
  "nfpa-25": "Sprinkler & water-based",
  "nfpa-72": "Fire alarm",
  "nfpa-96": "Kitchen hood suppression",
  "nfpa-101": "Means of egress",
  other: "Other items",
};

/** Derive a stable section key from NFPA citation or item label. */
export function getChecklistSectionKey(
  description: string | null,
  label: string,
): ChecklistSectionKey {
  const citation = description?.match(/NFPA\s+(\d+)/i)?.[1];
  if (citation === "10") return "nfpa-10";
  if (citation === "25") return "nfpa-25";
  if (citation === "72") return "nfpa-72";
  if (citation === "96") return "nfpa-96";
  if (citation === "101") return "nfpa-101";

  const text = label.toLowerCase();
  if (text.includes("extinguisher")) return "nfpa-10";
  if (
    text.includes("sprinkler") ||
    text.includes("standpipe") ||
    text.includes("fire pump") ||
    text.includes("control valve") ||
    text.includes("fire department connection") ||
    text.includes("waterflow") ||
    text.includes("dry pipe") ||
    text.includes("preaction") ||
    text.includes("main drain")
  ) {
    return "nfpa-25";
  }
  if (text.includes("fire alarm") || text.includes("notification appliance")) {
    return "nfpa-72";
  }
  if (text.includes("hood") || text.includes("kitchen") || text.includes("cooking")) {
    return "nfpa-96";
  }
  if (text.includes("egress") || text.includes("exit sign") || text.includes("emergency lighting")) {
    return "nfpa-101";
  }

  return "other";
}

export function getChecklistSectionLabel(key: ChecklistSectionKey): string {
  return SECTION_LABELS[key];
}

const SECTION_ORDER: ChecklistSectionKey[] = [
  "nfpa-10",
  "nfpa-25",
  "nfpa-72",
  "nfpa-96",
  "nfpa-101",
  "other",
];

export function groupChecklistItemsBySection(
  items: ChecklistItemSectionRef[],
): ChecklistSectionGroup[] {
  const buckets = new Map<ChecklistSectionKey, ChecklistItemSectionRef[]>();

  for (const item of items) {
    const key = getChecklistSectionKey(item.description, item.label);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  return SECTION_ORDER.filter((key) => buckets.has(key)).map((key) => {
    const sectionItems = buckets.get(key) ?? [];
    const pendingCount = sectionItems.filter(
      (item) => item.result === InspectionItemResult.pending,
    ).length;
    const completedCount = sectionItems.length - pendingCount;
    return {
      key,
      label: getChecklistSectionLabel(key),
      items: sectionItems,
      pendingCount,
      completedCount,
    };
  });
}

export function getPendingItemIdsInSection(
  items: ChecklistItemSectionRef[],
  sectionKey: ChecklistSectionKey,
): string[] {
  return items
    .filter(
      (item) =>
        item.result === InspectionItemResult.pending &&
        getChecklistSectionKey(item.description, item.label) === sectionKey,
    )
    .map((item) => item.id);
}

export function applySectionNaToItems<T extends ChecklistItemSectionRef>(
  items: T[],
  sectionKey: ChecklistSectionKey,
): T[] {
  return items.map((item) => {
    if (item.result !== InspectionItemResult.pending) return item;
    if (getChecklistSectionKey(item.description, item.label) !== sectionKey) return item;
    return { ...item, result: InspectionItemResult.na, notes: null };
  });
}
