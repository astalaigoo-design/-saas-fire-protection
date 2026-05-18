import type { InspectionStatus, Prisma } from "@prisma/client";
import { buildingLabel } from "@/lib/customers/format";
import { getMonthRangeFromParts } from "@/lib/scheduling/calendar";
import { prisma } from "@/lib/prisma";

const calendarInspectionSelect = {
  id: true,
  scheduledAt: true,
  status: true,
  recurrenceInterval: true,
  building: {
    select: {
      name: true,
      addressLine1: true,
      city: true,
      customer: { select: { name: true } },
    },
  },
  inspectionType: { select: { name: true } },
  assignedTo: { select: { name: true } },
} satisfies Prisma.InspectionSelect;

export type CalendarInspection = Prisma.InspectionGetPayload<{
  select: typeof calendarInspectionSelect;
}>;

export async function getCalendarInspections(
  companyId: string,
  year: number,
  month: number,
): Promise<CalendarInspection[]> {
  const { start, end } = getMonthRangeFromParts(year, month);

  return prisma.inspection.findMany({
    where: {
      companyId,
      scheduledAt: { gte: start, lt: end },
      status: { not: "cancelled" as InspectionStatus },
    },
    orderBy: { scheduledAt: "asc" },
    select: calendarInspectionSelect,
  });
}

export type ScheduleFormBuilding = {
  id: string;
  label: string;
  customerName: string;
};

export type ScheduleFormData = {
  buildings: ScheduleFormBuilding[];
  inspectionTypes: { id: string; name: string; code: string }[];
  technicians: { id: string; label: string }[];
};

export async function getScheduleFormData(companyId: string): Promise<ScheduleFormData> {
  const [buildings, inspectionTypes, technicians] = await Promise.all([
    prisma.building.findMany({
      where: { customer: { companyId } },
      select: {
        id: true,
        name: true,
        addressLine1: true,
        city: true,
        customer: { select: { name: true } },
      },
      orderBy: [{ customer: { name: "asc" } }, { addressLine1: "asc" }],
    }),
    prisma.inspectionType.findMany({
      where: { companyId },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { companyId, role: "technician", active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    buildings: buildings.map((building) => ({
      id: building.id,
      label: buildingLabel(building),
      customerName: building.customer.name,
    })),
    inspectionTypes,
    technicians: technicians.map((technician) => ({
      id: technician.id,
      label: technician.name ?? technician.email ?? "Technician",
    })),
  };
}
