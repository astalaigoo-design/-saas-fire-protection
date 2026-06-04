"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { InspectionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildingLabel } from "@/lib/customers/format";
import {
  bulkRescheduleInspections,
  dragRescheduleInspection,
} from "@/lib/scheduling/calendar-reschedule-actions";
import type { CalendarInspection } from "@/lib/scheduling/queries";
import {
  formatMonthLabel,
  shiftCalendarMonth,
  toDateInputValue,
  type CalendarMonth,
} from "@/lib/scheduling/calendar";
import { cn } from "@/lib/utils";

type InspectionCalendarProps = {
  month: CalendarMonth;
  inspections: CalendarInspection[];
  showScheduledBanner?: boolean;
  showUpdatedBanner?: boolean;
  showBulkBanner?: boolean;
  bulkMovedCount?: number;
  canEditJobs?: boolean;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusDotClass: Record<InspectionStatus, string> = {
  scheduled: "bg-sky-400",
  in_progress: "bg-amber-400",
  completed: "bg-emerald-400",
  cancelled: "bg-slate-500",
};

const editableStatuses: InspectionStatus[] = ["scheduled", "in_progress"];

function monthHref({ year, month }: CalendarMonth): string {
  return `/dashboard/jobs?year=${year}&month=${month}`;
}

function groupByDay(inspections: CalendarInspection[]): Map<string, CalendarInspection[]> {
  const map = new Map<string, CalendarInspection[]>();
  for (const inspection of inspections) {
    const key = toDateInputValue(new Date(inspection.scheduledAt));
    const list = map.get(key) ?? [];
    list.push(inspection);
    map.set(key, list);
  }
  return map;
}

function buildCalendarCells(year: number, month: number) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: Array<{ date: Date | null; dateKey: string | null }> = [];
  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ date: null, dateKey: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    cells.push({ date, dateKey: toDateInputValue(date) });
  }
  return cells;
}

export function InspectionCalendar({
  month,
  inspections,
  showScheduledBanner = false,
  showUpdatedBanner = false,
  showBulkBanner = false,
  bulkMovedCount = 0,
  canEditJobs = false,
}: InspectionCalendarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkTargetDate, setBulkTargetDate] = useState("");
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const byDay = useMemo(() => groupByDay(inspections), [inspections]);
  const cells = buildCalendarCells(month.year, month.month);
  const prev = shiftCalendarMonth(month, -1);
  const next = shiftCalendarMonth(month, 1);
  const todayKey = toDateInputValue(new Date());

  const editableInspections = useMemo(
    () => inspections.filter((i) => editableStatuses.includes(i.status)),
    [inspections],
  );

  const clearMessages = useCallback(() => {
    setStatusMessage(null);
    setErrorMessage(null);
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prevIds) => {
      const nextIds = new Set(prevIds);
      if (nextIds.has(id)) nextIds.delete(id);
      else nextIds.add(id);
      return nextIds;
    });
  }, []);

  const exitBulkMode = useCallback(() => {
    setBulkMode(false);
    setSelectedIds(new Set());
    setBulkTargetDate("");
    clearMessages();
  }, [clearMessages]);

  const handleDragStart = useCallback(
    (event: React.DragEvent, inspection: CalendarInspection) => {
      if (!canEditJobs || bulkMode) return;
      if (!editableStatuses.includes(inspection.status)) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData("text/plain", inspection.id);
      event.dataTransfer.effectAllowed = "move";
    },
    [bulkMode, canEditJobs],
  );

  const handleDropOnDay = useCallback(
    (event: React.DragEvent, dateKey: string) => {
      event.preventDefault();
      setDragOverDateKey(null);
      if (!canEditJobs || bulkMode) return;

      const inspectionId = event.dataTransfer.getData("text/plain");
      if (!inspectionId) return;

      clearMessages();
      startTransition(async () => {
        const result = await dragRescheduleInspection({
          inspectionId,
          targetDate: dateKey,
        });
        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }
        if (result.movedCount > 0) {
          setStatusMessage("Job moved — technician notified when assigned.");
        }
        router.refresh();
      });
    },
    [bulkMode, canEditJobs, clearMessages, router],
  );

  const handleBulkApply = useCallback(() => {
    if (selectedIds.size === 0) {
      setErrorMessage("Select at least one job.");
      return;
    }
    if (!bulkTargetDate) {
      setErrorMessage("Choose a date to move selected jobs to.");
      return;
    }

    clearMessages();
    startTransition(async () => {
      const result = await bulkRescheduleInspections({
        inspectionIds: Array.from(selectedIds),
        targetDate: bulkTargetDate,
      });
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      const count = result.movedCount;
      const params = new URLSearchParams({
        year: String(month.year),
        month: String(month.month),
        bulk: "1",
        moved: String(count),
      });
      router.push(`/dashboard/jobs?${params.toString()}`);
      router.refresh();
      exitBulkMode();
    });
  }, [
    bulkTargetDate,
    clearMessages,
    exitBulkMode,
    month.month,
    month.year,
    router,
    selectedIds,
  ]);

  return (
    <section className="space-y-4" aria-label="Inspection calendar">
      {showScheduledBanner ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
        >
          Inspection scheduled successfully.
        </p>
      ) : null}
      {showUpdatedBanner ? (
        <p
          role="status"
          className="rounded-lg border border-sky-900/50 bg-sky-950/40 px-4 py-3 text-sm text-sky-200"
        >
          Job updated — assigned and previous technicians notified in-app; email/SMS when
          configured.
        </p>
      ) : null}
      {showBulkBanner && bulkMovedCount > 0 ? (
        <p
          role="status"
          className="rounded-lg border border-sky-900/50 bg-sky-950/40 px-4 py-3 text-sm text-sky-200"
        >
          {bulkMovedCount} job{bulkMovedCount === 1 ? "" : "s"} rescheduled — technicians
          notified when assigned.
        </p>
      ) : null}
      {statusMessage ? (
        <p role="status" className="rounded-lg border border-sky-900/50 bg-sky-950/40 px-4 py-3 text-sm text-sky-200">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">
          {formatMonthLabel(month.year, month.month)}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={monthHref(prev)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            Previous
          </Link>
          <Link
            href={monthHref(next)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            Next
          </Link>
          {canEditJobs ? (
            <Button
              type="button"
              variant={bulkMode ? "default" : "outline"}
              className="min-h-11"
              onClick={() => (bulkMode ? exitBulkMode() : setBulkMode(true))}
              disabled={isPending}
            >
              {bulkMode ? "Cancel bulk" : "Bulk reschedule"}
            </Button>
          ) : null}
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            Schedule
          </Link>
        </div>
      </div>

      {bulkMode && canEditJobs ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-100">
            Select jobs on the calendar, then choose a new date. Each job keeps its scheduled time
            of day. Only scheduled and in-progress visits can be moved.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="bulk-target-date" className="text-slate-200">
                Move selected to
              </Label>
              <Input
                id="bulk-target-date"
                type="date"
                value={bulkTargetDate}
                onChange={(e) => setBulkTargetDate(e.target.value)}
                className="min-h-11 w-full max-w-xs bg-slate-950"
                disabled={isPending}
              />
            </div>
            <Button
              type="button"
              className="min-h-11"
              onClick={handleBulkApply}
              disabled={isPending || selectedIds.size === 0}
            >
              {isPending
                ? "Moving…"
                : `Move ${selectedIds.size} job${selectedIds.size === 1 ? "" : "s"}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-slate-600 text-slate-100"
              onClick={() => {
                setSelectedIds(new Set(editableInspections.map((i) => i.id)));
              }}
              disabled={isPending || editableInspections.length === 0}
            >
              Select all ({editableInspections.length})
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <div className="min-w-[36rem]">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/80">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, index) => {
              if (!cell.date || !cell.dateKey) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-28 border-b border-r border-slate-800/60 bg-slate-950/40"
                  />
                );
              }

              const dayInspections = byDay.get(cell.dateKey) ?? [];
              const isToday = cell.dateKey === todayKey;
              const isDropTarget = dragOverDateKey === cell.dateKey;

              return (
                <div
                  key={cell.dateKey}
                  className={cn(
                    "min-h-28 border-b border-r border-slate-800/60 p-1.5 transition-colors",
                    isToday ? "bg-amber-500/5" : "bg-slate-900/30",
                    isDropTarget && canEditJobs && !bulkMode && "bg-sky-500/15 ring-1 ring-inset ring-sky-500/50",
                  )}
                  onDragOver={(event) => {
                    if (!canEditJobs || bulkMode) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverDateKey(cell.dateKey);
                  }}
                  onDragLeave={() => {
                    if (dragOverDateKey === cell.dateKey) setDragOverDateKey(null);
                  }}
                  onDrop={(event) => {
                    if (cell.dateKey) handleDropOnDay(event, cell.dateKey);
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/jobs/new?date=${cell.dateKey}`)
                    }
                    className="mb-1 flex min-h-9 w-full items-center justify-between rounded-md px-1.5 text-left hover:bg-slate-800/80"
                    aria-label={`Schedule inspection on ${cell.dateKey}`}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isToday ? "text-amber-400" : "text-slate-200",
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                    <span className="text-xs text-slate-500">+</span>
                  </button>
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {dayInspections.map((inspection) => {
                      const editable = editableStatuses.includes(inspection.status);
                      const selected = selectedIds.has(inspection.id);
                      const detailHref = canEditJobs
                        ? `/dashboard/jobs/${inspection.id}`
                        : `/inspect/${inspection.id}`;

                      return (
                        <li key={inspection.id}>
                          {bulkMode && canEditJobs && editable ? (
                            <label className="flex cursor-pointer items-start gap-1.5 rounded-md bg-slate-800/80 px-1.5 py-1 text-[11px] leading-tight text-slate-200 hover:bg-slate-700/80">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-amber-500"
                                checked={selected}
                                onChange={() => toggleSelected(inspection.id)}
                                disabled={isPending}
                                aria-label={`Select ${buildingLabel(inspection.building)}`}
                              />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusDotClass[inspection.status]}`}
                                  aria-hidden
                                />
                                <span className="line-clamp-2">
                                  {buildingLabel(inspection.building)}
                                </span>
                              </span>
                            </label>
                          ) : (
                            <div
                              draggable={canEditJobs && editable && !bulkMode}
                              onDragStart={(event) => handleDragStart(event, inspection)}
                              className={cn(
                                canEditJobs && editable && !bulkMode && "cursor-grab active:cursor-grabbing",
                              )}
                            >
                              <Link
                                href={detailHref}
                                className="block rounded-md bg-slate-800/80 px-1.5 py-1 text-[11px] leading-tight text-slate-200 hover:bg-slate-700/80"
                                title={`${buildingLabel(inspection.building)} · ${inspection.inspectionType.name}${inspection.assignedTo?.name ? ` · ${inspection.assignedTo.name}` : ""}${canEditJobs && editable && !bulkMode ? " — drag to another day" : ""}`}
                                onClick={(event) => {
                                  if (isPending) event.preventDefault();
                                }}
                              >
                                <span
                                  className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusDotClass[inspection.status]}`}
                                  aria-hidden
                                />
                                <span className="line-clamp-2">
                                  {buildingLabel(inspection.building)}
                                </span>
                              </Link>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {canEditJobs
          ? "Drag a job to another day to reschedule (time stays the same), use bulk reschedule for many jobs, or open a job for assignee and time changes."
          : "Click a day to schedule a new inspection. Recurring series appear on each occurrence date."}
      </p>
    </section>
  );
}
