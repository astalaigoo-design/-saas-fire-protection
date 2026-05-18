"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type { BuildingInspectionRow } from "@/lib/buildings/queries";
import { ComplianceBadge } from "@/components/buildings/compliance-badge";
import { InspectionStatusBadge } from "@/components/customers/inspection-status-badge";
import { formatDate, formatDateTime } from "@/lib/dashboard/dates";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortKey = "date" | "type" | "status" | "inspector";

type BuildingInspectionHistoryTabProps = {
  inspections: BuildingInspectionRow[];
};

function inspectionDate(inspection: BuildingInspectionRow): Date {
  return inspection.completedAt ?? inspection.scheduledAt;
}

const complianceRowClass: Record<string, string> = {
  pass: "border-l-4 border-l-emerald-500/70",
  fail: "border-l-4 border-l-red-500/70",
  warning: "border-l-4 border-l-amber-500/70",
  unknown: "",
};

export function BuildingInspectionHistoryTab({
  inspections,
}: BuildingInspectionHistoryTabProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...inspections];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = inspectionDate(a).getTime() - inspectionDate(b).getTime();
          break;
        case "type":
          cmp = a.inspectionType.name.localeCompare(b.inspectionType.name);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "inspector":
          cmp = (a.assignedTo?.name ?? "").localeCompare(b.assignedTo?.name ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [inspections, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortButton({ label, column }: { label: string; column: SortKey }) {
    const active = sortKey === column;
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className="inline-flex min-h-10 items-center gap-1 font-medium hover:text-foreground"
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUpIcon className="size-3.5" aria-hidden />
          ) : (
            <ArrowDownIcon className="size-3.5" aria-hidden />
          )
        ) : null}
      </button>
    );
  }

  if (inspections.length === 0) {
    return <EmptyState title="No inspections yet" description="Schedule the first visit for this building." />;
  }

  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">
                  <SortButton label="Date" column="date" />
                </TableHead>
                <TableHead className="px-4">
                  <SortButton label="Type" column="type" />
                </TableHead>
                <TableHead className="px-4">
                  <SortButton label="Status" column="status" />
                </TableHead>
                <TableHead className="px-4">Result</TableHead>
                <TableHead className="px-4">
                  <SortButton label="Inspector" column="inspector" />
                </TableHead>
                <TableHead className="px-4 text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((inspection) => (
                <TableRow
                  key={inspection.id}
                  className={cn(complianceRowClass[inspection.compliance])}
                >
                  <TableCell className="px-4 text-muted-foreground">
                    {inspection.status === "completed" && inspection.completedAt
                      ? formatDate(inspection.completedAt)
                      : formatDateTime(inspection.scheduledAt)}
                  </TableCell>
                  <TableCell className="px-4">{inspection.inspectionType.name}</TableCell>
                  <TableCell className="px-4">
                    <InspectionStatusBadge status={inspection.status} />
                  </TableCell>
                  <TableCell className="px-4">
                    {inspection.status === "completed" ? (
                      <ComplianceBadge level={inspection.compliance} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {inspection.assignedTo?.name ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <Link
                      href={`/inspect/${inspection.id}`}
                      className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ul className="space-y-3 md:hidden">
        {sorted.map((inspection) => (
          <li key={inspection.id}>
            <Card className={cn(complianceRowClass[inspection.compliance])}>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {inspection.inspectionType.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inspection.status === "completed" && inspection.completedAt
                        ? formatDate(inspection.completedAt)
                        : formatDateTime(inspection.scheduledAt)}
                    </p>
                  </div>
                  <InspectionStatusBadge status={inspection.status} />
                </div>
                {inspection.status === "completed" ? (
                  <ComplianceBadge level={inspection.compliance} />
                ) : null}
                <Link
                  href={`/inspect/${inspection.id}`}
                  className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}
                >
                  Open inspection
                </Link>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
