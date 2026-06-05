import { createStaffNotification } from "@/lib/notifications/create";
import { notifyTechnicianForInspection } from "@/lib/scheduling/notify-technician-job";
import { prisma } from "@/lib/prisma";

function formatScheduleDate(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function notifyInspectionScheduled(input: {
  companyId: string;
  inspectionId: string;
  occurrenceCount: number;
  customerPortalRequest?: { customerName: string };
}): Promise<void> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: {
      id: true,
      scheduledAt: true,
      assignedTo: { select: { id: true, name: true } },
      inspectionType: { select: { name: true } },
      building: {
        select: {
          name: true,
          addressLine1: true,
          city: true,
        },
      },
    },
  });

  if (!inspection) return;

  const buildingLabel = [inspection.building.name, inspection.building.city]
    .filter(Boolean)
    .join(" · ");
  const when = formatScheduleDate(inspection.scheduledAt);
  const assigneeName = inspection.assignedTo?.name?.trim() || null;
  const portalCustomer = input.customerPortalRequest?.customerName?.trim();
  const countLabel =
    input.occurrenceCount > 1
      ? `${input.occurrenceCount} recurring visits`
      : portalCustomer
        ? "Customer requested inspection"
        : "Inspection scheduled";

  const href = `/dashboard/jobs?year=${inspection.scheduledAt.getFullYear()}&month=${inspection.scheduledAt.getMonth() + 1}`;

  const portalSuffix = portalCustomer ? ` · requested by ${portalCustomer} via portal` : "";

  await createStaffNotification({
    companyId: input.companyId,
    type: "inspection.scheduled",
    title: countLabel,
    body: `${inspection.inspectionType.name} at ${buildingLabel} — ${when}${assigneeName ? ` · assigned to ${assigneeName}` : ""}${portalSuffix}.`,
    href,
    entityType: "inspection",
    entityId: inspection.id,
    emailOwnersAndAdmins: true,
  });

  if (inspection.assignedTo?.id) {
    await notifyTechnicianForInspection({
      companyId: input.companyId,
      inspectionId: inspection.id,
      kind: "assigned",
      knownSeriesOccurrenceCount: input.occurrenceCount,
    });
  }
}
