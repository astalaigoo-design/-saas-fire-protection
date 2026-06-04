"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InspectionStatus } from "@prisma/client";
import { buildingLabel } from "@/lib/customers/format";
import type { CalendarInspection } from "@/lib/scheduling/queries";
import {
  formatMonthLabel,
  shiftCalendarMonth,
  toDateInputValue,
  type CalendarMonth,
} from "@/lib/scheduling/calendar";

type InspectionCalendarProps = {
  month: CalendarMonth;
  inspections: CalendarInspection[];
  showScheduledBanner?: boolean;
  showUpdatedBanner?: boolean;
  canEditJobs?: boolean;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusDotClass: Record<InspectionStatus, string> = {
  scheduled: "bg-sky-400",
  in_progress: "bg-amber-400",
  completed: "bg-emerald-400",
  cancelled: "bg-slate-500",
};

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
  canEditJobs = false,
}: InspectionCalendarProps) {
  const router = useRouter();
  const byDay = groupByDay(inspections);
  const cells = buildCalendarCells(month.year, month.month);
  const prev = shiftCalendarMonth(month, -1);
  const next = shiftCalendarMonth(month, 1);
  const todayKey = toDateInputValue(new Date());

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
          Job updated — technician notified in-app; email/SMS when configured and contact on file.
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
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            Schedule
          </Link>
        </div>
      </div>

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
                    className="min-h-24 border-b border-r border-slate-800/60 bg-slate-950/40"
                  />
                );
              }

              const dayInspections = byDay.get(cell.dateKey) ?? [];
              const isToday = cell.dateKey === todayKey;

              return (
                <div
                  key={cell.dateKey}
                  className={`min-h-24 border-b border-r border-slate-800/60 p-1.5 ${
                    isToday ? "bg-amber-500/5" : "bg-slate-900/30"
                  }`}
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
                      className={`text-sm font-medium ${
                        isToday ? "text-amber-400" : "text-slate-200"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    <span className="text-xs text-slate-500">+</span>
                  </button>
                  <ul className="space-y-1">
                    {dayInspections.slice(0, 2).map((inspection) => (
                      <li key={inspection.id}>
                        <Link
                          href={
                            canEditJobs
                              ? `/dashboard/jobs/${inspection.id}`
                              : `/inspect/${inspection.id}`
                          }
                          className="block rounded-md bg-slate-800/80 px-1.5 py-1 text-[11px] leading-tight text-slate-200 hover:bg-slate-700/80"
                          title={`${buildingLabel(inspection.building)} · ${inspection.inspectionType.name}${inspection.assignedTo?.name ? ` · ${inspection.assignedTo.name}` : ""}`}
                        >
                          <span
                            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusDotClass[inspection.status]}`}
                            aria-hidden
                          />
                          <span className="line-clamp-2">
                            {buildingLabel(inspection.building)}
                          </span>
                        </Link>
                      </li>
                    ))}
                    {dayInspections.length > 2 ? (
                      <li className="px-1 text-[10px] text-slate-500">
                        +{dayInspections.length - 2} more
                      </li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Click a day to schedule a new inspection. Recurring series appear on each
        occurrence date.
      </p>
    </section>
  );
}
