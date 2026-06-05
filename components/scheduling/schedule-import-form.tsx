"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  runScheduleImport,
  type ScheduleImportCommitResult,
  type ScheduleImportPreviewResult,
} from "@/lib/scheduling/import-csv-actions";
import {
  SCHEDULE_IMPORT_MAX_ROWS,
  SCHEDULE_IMPORT_MAX_VISITS,
} from "@/lib/scheduling/import-csv-schemas";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ScheduleImportFormProps = {
  branchHint: string;
};

const statusClass: Record<string, string> = {
  ready: "text-emerald-400",
  error: "text-destructive",
  duplicate: "text-amber-400",
};

export function ScheduleImportForm({ branchHint }: ScheduleImportFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScheduleImportPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<ScheduleImportCommitResult | null>(null);
  const [isPending, startTransition] = useTransition();

  async function readSelectedFile(): Promise<string | null> {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return null;
    }
    if (file.size > 512_000) {
      setError("File is too large (max 512 KB).");
      return null;
    }
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    setCommitResult(null);
    return text;
  }

  function handlePreview() {
    setError(null);
    setPreview(null);
    startTransition(async () => {
      const text = csvText ?? (await readSelectedFile());
      if (!text) return;
      const result = await runScheduleImport({ mode: "preview", csv: text });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.mode !== "preview") return;
      setPreview(result);
    });
  }

  function handleCommit() {
    if (!csvText) {
      setError("Preview the file again before importing.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await runScheduleImport({ mode: "commit", csv: csvText });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.mode !== "commit") return;
      setCommitResult(result);
      setPreview(null);
    });
  }

  const visitCapExceeded =
    preview?.ok &&
    preview.mode === "preview" &&
    preview.summary.totalVisits > SCHEDULE_IMPORT_MAX_VISITS;

  return (
    <div className="space-y-6">
      <Card className="mx-auto max-w-4xl">
        <CardContent className="space-y-6 pt-6">
          <p className="text-sm text-muted-foreground">
            Bulk-load a quarter of work — e.g. 40 annuals for Q3 across a property manager portfolio.
            Import after customers and buildings are in FlareFlow. Each row needs{" "}
            <strong className="font-medium text-foreground">building</strong> (site name),{" "}
            <strong className="font-medium text-foreground">inspection_type</strong> (
            <span className="font-mono text-xs">annual</span>, quarterly, monthly, or exact type
            name), <strong className="font-medium text-foreground">scheduled_date</strong> (
            YYYY-MM-DD), and optional <strong className="font-medium text-foreground">technician</strong>{" "}
            (email or name). <strong className="font-medium text-foreground">customer</strong> is
            optional when the building name is unique in{" "}
            <strong className="font-medium text-foreground">branch</strong> ({branchHint}). Up to{" "}
            {SCHEDULE_IMPORT_MAX_ROWS} rows / {SCHEDULE_IMPORT_MAX_VISITS} visits per file.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="/api/dashboard/jobs/import-template"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
            >
              Download template
            </a>
            <label
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "min-h-11 cursor-pointer",
              )}
            >
              Choose CSV
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={() => {
                  setCsvText(null);
                  setPreview(null);
                  setCommitResult(null);
                  setError(null);
                  setFileName(fileRef.current?.files?.[0]?.name ?? null);
                }}
              />
            </label>
            {fileName ? (
              <span className="text-sm text-muted-foreground">{fileName}</span>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isPending}
              onClick={handlePreview}
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5 disabled:opacity-60")}
            >
              {isPending && !preview ? "Checking…" : "Preview import"}
            </button>
            <Link
              href="/dashboard/jobs"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "min-h-11")}
            >
              Cancel
            </Link>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          {commitResult?.ok ? (
            <p
              role="status"
              className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
            >
              Scheduled {commitResult.scheduledVisits} visit
              {commitResult.scheduledVisits === 1 ? "" : "s"} from {commitResult.scheduledRows} row
              {commitResult.scheduledRows === 1 ? "" : "s"}.{" "}
              <Link href="/dashboard/jobs" className="font-medium underline underline-offset-4">
                Open calendar
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {preview?.ok && preview.mode === "preview" ? (
        <section className="space-y-4" aria-label="Import preview">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {preview.summary.ready} ready · {preview.summary.totalVisits} visit
              {preview.summary.totalVisits === 1 ? "" : "s"} · {preview.summary.errors} error
              {preview.summary.errors === 1 ? "" : "s"} · {preview.summary.duplicates} duplicate
              {preview.summary.duplicates === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              disabled={isPending || !preview.canCommit}
              onClick={handleCommit}
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-5 disabled:opacity-60")}
            >
              {isPending ? "Scheduling…" : `Schedule ${preview.summary.totalVisits} visits`}
            </button>
          </div>

          {visitCapExceeded ? (
            <p role="alert" className="text-sm text-destructive">
              Too many visits ({preview.summary.totalVisits}). Maximum {SCHEDULE_IMPORT_MAX_VISITS}{" "}
              per file — use none recurrence or fewer rows.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Branch</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Site</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Technician</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={`${row.line}-${row.customer}-${row.when}`}
                    className="border-b border-border/60"
                  >
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.line}</td>
                    <td className={cn("px-3 py-2 capitalize", statusClass[row.status])}>
                      {row.status}
                    </td>
                    <td className="px-3 py-2">{row.branch}</td>
                    <td className="px-3 py-2">{row.customer}</td>
                    <td className="px-3 py-2">{row.site}</td>
                    <td className="px-3 py-2">{row.inspectionType}</td>
                    <td className="px-3 py-2 tabular-nums">{row.when}</td>
                    <td className="px-3 py-2">{row.technician}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
