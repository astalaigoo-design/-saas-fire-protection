import { InspectionItemResult } from "@prisma/client";
import { publicQuoteUrl } from "@/lib/app-url";
import { buildReportFinalizedWebhookPayload } from "@/lib/integrations/build-report-finalized-payload";
import { dispatchCompanyWebhooks } from "@/lib/integrations/dispatch";
import { prisma } from "@/lib/prisma";

export async function emitInspectionCompletedWebhook(
  companyId: string,
  inspectionId: string,
): Promise<void> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: inspectionId, companyId },
    select: {
      id: true,
      buildingId: true,
      completedAt: true,
      arrivedAt: true,
      startedAt: true,
      mileageMiles: true,
      arrivalLatitude: true,
      arrivalLongitude: true,
      submitLatitude: true,
      submitLongitude: true,
      status: true,
      building: {
        select: {
          customerId: true,
          currentStatus: true,
        },
      },
      inspectionType: { select: { name: true, code: true } },
      items: { select: { result: true } },
    },
  });
  if (!inspection?.completedAt) return;

  const hasFailedItems = inspection.items.some(
    (item) => item.result === InspectionItemResult.fail,
  );

  await dispatchCompanyWebhooks({
    companyId,
    event: "inspection_completed",
    data: {
      inspectionId: inspection.id,
      buildingId: inspection.buildingId,
      customerId: inspection.building.customerId,
      inspectionType: inspection.inspectionType.name,
      inspectionTypeCode: inspection.inspectionType.code,
      status: inspection.status,
      completedAt: inspection.completedAt.toISOString(),
      arrivedAt: inspection.arrivedAt?.toISOString() ?? null,
      startedAt: inspection.startedAt?.toISOString() ?? null,
      mileageMiles: inspection.mileageMiles,
      hasArrivalGps:
        inspection.arrivalLatitude != null && inspection.arrivalLongitude != null,
      hasSubmitGps:
        inspection.submitLatitude != null && inspection.submitLongitude != null,
      hasFailedItems,
      buildingComplianceStatus: inspection.building.currentStatus,
    },
  });
}

export async function emitReportFinalizedWebhook(input: {
  companyId: string;
  reportId: string;
  inspectionId: string;
  shareToken: string;
  certificateNumber?: string | null;
}): Promise<void> {
  const report = await prisma.report.findFirst({
    where: { id: input.reportId, companyId: input.companyId },
    select: { reportTemplateKey: true },
  });

  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: {
      completedAt: true,
      buildingId: true,
      building: {
        select: {
          customerId: true,
          name: true,
          addressLine1: true,
          city: true,
          fireDistrict: true,
          permitNumber: true,
          permitExpiresAt: true,
          jurisdiction: {
            select: {
              id: true,
              code: true,
              name: true,
              reportTemplateKey: true,
            },
          },
        },
      },
      inspectionType: { select: { name: true, code: true } },
      items: { select: { result: true } },
    },
  });
  if (!inspection) return;

  const data = buildReportFinalizedWebhookPayload({
    reportId: input.reportId,
    inspectionId: input.inspectionId,
    shareToken: input.shareToken,
    certificateNumber: input.certificateNumber ?? null,
    reportTemplateKey: report?.reportTemplateKey ?? "default",
    inspection,
  });

  await dispatchCompanyWebhooks({
    companyId: input.companyId,
    event: "report_finalized",
    data,
  });
}

export async function emitQuoteUpdatedWebhook(
  companyId: string,
  quoteId: string,
): Promise<void> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId },
    select: {
      id: true,
      status: true,
      totalCents: true,
      title: true,
      shareToken: true,
      statusChangedAt: true,
      inspection: {
        select: {
          id: true,
          buildingId: true,
          building: { select: { customerId: true, name: true } },
        },
      },
    },
  });
  if (!quote) return;

  await dispatchCompanyWebhooks({
    companyId,
    event: "quote_updated",
    data: {
      quoteId: quote.id,
      status: quote.status,
      totalCents: quote.totalCents,
      title: quote.title,
      inspectionId: quote.inspection.id,
      buildingId: quote.inspection.buildingId,
      customerId: quote.inspection.building.customerId,
      buildingName: quote.inspection.building.name,
      statusChangedAt: quote.statusChangedAt?.toISOString() ?? null,
      publicQuoteUrl: quote.shareToken ? publicQuoteUrl(quote.shareToken) : null,
    },
  });
}

export async function emitDeficiencyCreatedWebhook(
  companyId: string,
  deficiencyId: string,
): Promise<void> {
  const row = await prisma.deficiency.findFirst({
    where: { id: deficiencyId, companyId },
    select: {
      id: true,
      buildingId: true,
      label: true,
      status: true,
      dueAt: true,
      sourceInspectionId: true,
      building: { select: { customerId: true } },
    },
  });
  if (!row) return;

  await dispatchCompanyWebhooks({
    companyId,
    event: "deficiency_created",
    data: {
      deficiencyId: row.id,
      buildingId: row.buildingId,
      customerId: row.building.customerId,
      sourceInspectionId: row.sourceInspectionId,
      label: row.label,
      status: row.status,
      dueAt: row.dueAt?.toISOString() ?? null,
    },
  });
}

export async function emitCustomerCreatedWebhook(
  companyId: string,
  customerId: string,
): Promise<void> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      branchId: true,
      createdAt: true,
      buildings: {
        select: { id: true, addressLine1: true, city: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!customer) return;

  const building = customer.buildings[0] ?? null;

  await dispatchCompanyWebhooks({
    companyId,
    event: "customer_created",
    data: {
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      branchId: customer.branchId,
      buildingId: building?.id ?? null,
      buildingAddress: building
        ? `${building.addressLine1}, ${building.city}`
        : null,
      createdAt: customer.createdAt.toISOString(),
    },
  });
}

export async function emitInspectionScheduledWebhook(
  companyId: string,
  inspectionId: string,
): Promise<void> {
  const inspection = await prisma.inspection.findFirst({
    where: { id: inspectionId, companyId },
    select: {
      id: true,
      buildingId: true,
      status: true,
      scheduledAt: true,
      assignedToUserId: true,
      notes: true,
      building: {
        select: {
          customerId: true,
          name: true,
          addressLine1: true,
          city: true,
        },
      },
      inspectionType: { select: { name: true, code: true } },
    },
  });
  if (!inspection) return;

  await dispatchCompanyWebhooks({
    companyId,
    event: "inspection_scheduled",
    data: {
      inspectionId: inspection.id,
      buildingId: inspection.buildingId,
      customerId: inspection.building.customerId,
      buildingName: inspection.building.name,
      buildingAddress: `${inspection.building.addressLine1}, ${inspection.building.city}`,
      status: inspection.status,
      inspectionType: inspection.inspectionType.name,
      inspectionTypeCode: inspection.inspectionType.code,
      scheduledAt: inspection.scheduledAt.toISOString(),
      assignedToUserId: inspection.assignedToUserId,
      notes: inspection.notes,
    },
  });
}
