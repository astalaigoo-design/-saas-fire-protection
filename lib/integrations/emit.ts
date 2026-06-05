import { InspectionItemResult } from "@prisma/client";
import { publicQuoteUrl, publicReportUrl } from "@/lib/app-url";
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
  const inspection = await prisma.inspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    select: {
      buildingId: true,
      building: { select: { customerId: true } },
    },
  });
  if (!inspection) return;

  await dispatchCompanyWebhooks({
    companyId: input.companyId,
    event: "report_finalized",
    data: {
      reportId: input.reportId,
      inspectionId: input.inspectionId,
      buildingId: inspection.buildingId,
      customerId: inspection.building.customerId,
      publicReportUrl: publicReportUrl(input.shareToken),
      certificateNumber: input.certificateNumber ?? null,
    },
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
