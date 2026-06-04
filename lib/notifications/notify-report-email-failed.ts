import { buildingLabel } from "@/lib/customers/format";
import { createStaffNotification } from "@/lib/notifications/create";
import { prisma } from "@/lib/prisma";

export async function notifyReportEmailFailed(input: {
  companyId: string;
  inspectionId: string;
  reason: string;
  buildingLabel?: string;
}): Promise<void> {
  let label = input.buildingLabel?.trim();
  if (!label) {
    const inspection = await prisma.inspection.findFirst({
      where: { id: input.inspectionId, companyId: input.companyId },
      select: {
        building: { select: { name: true, addressLine1: true, city: true } },
      },
    });
    if (!inspection) return;
    label = buildingLabel(inspection.building);
  }

  await createStaffNotification({
    companyId: input.companyId,
    type: "report.email_failed",
    title: `Report email failed — ${label}`,
    body: input.reason,
    href: `/dashboard/reports?inspection=${encodeURIComponent(input.inspectionId)}`,
    entityType: "inspection",
    entityId: input.inspectionId,
    emailOwnersAndAdmins: true,
  });
}
