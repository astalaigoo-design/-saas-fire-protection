"use client";

import { useCallback, useRef, useState } from "react";
import { InspectionItemResult } from "@prisma/client";
import {
  ChecklistItemCard,
  type ChecklistItemState,
} from "@/components/inspect/checklist-item-card";

type ChecklistCarouselProps = {
  inspectionId: string;
  items: ChecklistItemState[];
  locked: boolean;
  onItemsChange: (items: ChecklistItemState[]) => void;
};

export function ChecklistCarousel({
  inspectionId,
  items,
  locked,
  onItemsChange,
}: ChecklistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const completedCount = items.filter(
    (item) => item.result !== InspectionItemResult.pending,
  ).length;

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !container.firstElementChild) return;
    const card = container.firstElementChild as HTMLElement;
    const gap = 12;
    const index = Math.round(container.scrollLeft / (card.offsetWidth + gap));
    setActiveIndex(Math.min(Math.max(index, 0), items.length - 1));
  }, [items.length]);

  const updateItem = (updated: ChecklistItemState) => {
    onItemsChange(items.map((item) => (item.id === updated.id ? updated : item)));
  };

  return (
    <section className="space-y-3" aria-label="Inspection checklist">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-sm font-semibold text-white">Checklist</h2>
        <span className="text-sm text-slate-400">
          {completedCount}/{items.length} done
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <ChecklistItemCard
            key={item.id}
            inspectionId={inspectionId}
            item={item}
            index={index}
            total={items.length}
            locked={locked}
            onUpdated={updateItem}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1.5 px-4">
        {items.map((item, index) => (
          <span
            key={item.id}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? "w-6 bg-amber-400" : "w-2 bg-slate-700"
            } ${
              item.result === InspectionItemResult.pass
                ? "!bg-emerald-500/90"
                : item.result === InspectionItemResult.fail
                  ? "!bg-red-500/90"
                  : item.result === InspectionItemResult.na
                    ? "!bg-slate-500"
                    : ""
            }`}
            aria-hidden
          />
        ))}
      </div>
      <p className="px-4 text-center text-xs text-slate-500">Swipe for next item →</p>
    </section>
  );
}
