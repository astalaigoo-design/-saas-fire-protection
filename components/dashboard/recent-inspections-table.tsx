import type { ReactNode } from "react";
import type { InspectionListItem } from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/dashboard/dates";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RecentInspectionsTableProps = {
  inspections: InspectionListItem[];
  emptyContent?: ReactNode;
};

function buildingLabel(inspection: InspectionListItem): string {
  return (
    inspection.building.name ??
    `${inspection.building.addressLine1}, ${inspection.building.city}`
  );
}

export function RecentInspectionsTable({
  inspections,
  emptyContent,
}: RecentInspectionsTableProps) {
  if (inspections.length === 0) {
    if (emptyContent) return emptyContent;
    return (
      <EmptyState
        title="No completed inspections yet"
        description="Finished visits will appear here for quick review."
      />
    );
  }

  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Building</TableHead>
                <TableHead className="px-4">Customer</TableHead>
                <TableHead className="px-4">Type</TableHead>
                <TableHead className="px-4">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell className="px-4 font-medium text-foreground">
                    {buildingLabel(inspection)}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {inspection.building.customer.name}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {inspection.inspectionType.name}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {inspection.completedAt ? formatDate(inspection.completedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ul className="space-y-3 md:hidden">
        {inspections.map((inspection) => (
          <li key={inspection.id}>
            <Card>
              <CardContent>
                <p className="font-medium text-foreground">{buildingLabel(inspection)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {inspection.building.customer.name}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="text-foreground">{inspection.inspectionType.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd className="text-foreground">
                      {inspection.completedAt ? formatDate(inspection.completedAt) : "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
