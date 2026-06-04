import { UserRole } from "@prisma/client";
import { buildingLabel } from "@/lib/customers/format";
import { sendTechnicianJobEmail, type TechnicianJobEmailKind } from "@/lib/email/send-technician-job-email";
import { createStaffNotification } from "@/lib/notifications/create";
import { prisma } from "@/lib/prisma";

const inspectionNotifySelect = {
  id: true,
  scheduledAt: true,
  assignedToUserId: true,
  assignedTo: {
    select: { id: true, name: true, email: true, role: true, active: true },
  },
  inspectionType: { select: { name: true } },
  company: { select: { name: true } },
  building: {
    select: { name: true, addressLine1: true, city: true },
  },
} as const;

export async function notifyTechnicianForInspection(input: {
  companyId: string;
  inspectionId: string;
  kind: TechnicianJobEmailKind;
  previousScheduledAt?: Date | null;
  occurrenceNote?: string | null;
}): Promise<void> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: inspectionNotifySelect,
  });

  if (!inspection?.assignedToUserId || !inspection.assignedTo) return;
  if (inspection.assignedTo.role !== UserRole.technician) return;
  if (!inspection.assignedTo.active) return;

  const siteLabel = buildingLabel(inspection.building);
  const whenLabel = inspection.scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const inAppTitle =
    input.kind === "rescheduled" ? "Job rescheduled" : "New job assigned to you";
  const inAppBody =
    input.kind === "rescheduled"
      ? `${inspection.inspectionType.name} at ${siteLabel} — now ${whenLabel}.`
      : `${inspection.inspectionType.name} at ${siteLabel} — ${whenLabel}.${input.occurrenceNote ? ` ${input.occurrenceNote}` : ""}`;

  await createStaffNotification({
    companyId: input.companyId,
    type: input.kind === "rescheduled" ? "inspection.rescheduled" : "inspection.assigned",
    title: inAppTitle,
    body: inAppBody,
    href: `/inspect/${inspection.id}`,
    entityType: "inspection",
    entityId: inspection.id,
    targetUserId: inspection.assignedTo.id,
  });

  const email = inspection.assignedTo.email?.trim();
  if (!email) {
    console.warn("notifyTechnicianForInspection: assignee has no email", {
      inspectionId: inspection.id,
      userId: inspection.assignedTo.id,
    });
    return;
  }

  const result = await sendTechnicianJobEmail({
    to: email,
    technicianName: inspection.assignedTo.name,
    companyName: inspection.company.name,
    kind: input.kind,
    inspectionTypeName: inspection.inspectionType.name,
    buildingLabel: siteLabel,
    scheduledAt: inspection.scheduledAt,
    previousScheduledAt: input.previousScheduledAt,
    inspectionId: inspection.id,
    occurrenceNote: input.occurrenceNote,
  });

  if (!result.ok) {
    console.error("sendTechnicianJobEmail failed", result.error, {
      inspectionId: inspection.id,
    });
  }
}
