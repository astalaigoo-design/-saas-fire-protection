import { getAppOrigin, publicReportUrl } from "@/lib/app-url";

export type ReportFinalizedJurisdictionPayload = {
  id: string;
  code: string;
  name: string;
  reportTemplateKey: string;
};

export type ReportFinalizedWebhookPayload = {
  reportId: string;
  inspectionId: string;
  buildingId: string;
  customerId: string;
  certificateNumber: string | null;
  reportTemplateKey: string;
  inspectionType: string;
  inspectionTypeCode: string;
  overallPass: boolean;
  completedAt: string | null;
  publicReportUrl: string;
  publicReportPdfUrl: string;
  jurisdiction: ReportFinalizedJurisdictionPayload | null;
  fireDistrict: string | null;
  permitNumber: string | null;
  permitExpiresAt: string | null;
  buildingName: string | null;
  buildingAddress: string;
};

export function publicReportPdfUrl(shareToken: string): string {
  return `${getAppOrigin()}/api/public/reports/${shareToken}`;
}

type BuildReportFinalizedPayloadInput = {
  reportId: string;
  inspectionId: string;
  shareToken: string;
  certificateNumber: string | null;
  reportTemplateKey: string;
  inspection: {
    completedAt: Date | null;
    buildingId: string;
    building: {
      customerId: string;
      name: string | null;
      addressLine1: string;
      city: string;
      fireDistrict: string | null;
      permitNumber: string | null;
      permitExpiresAt: Date | null;
      jurisdiction: {
        id: string;
        code: string;
        name: string;
        reportTemplateKey: string;
      } | null;
    };
    inspectionType: { name: string; code: string };
    items: { result: string }[];
  };
};

export function buildReportFinalizedWebhookPayload(
  input: BuildReportFinalizedPayloadInput,
): ReportFinalizedWebhookPayload {
  const building = input.inspection.building;
  const jurisdiction = building.jurisdiction;
  const hasFail = input.inspection.items.some((item) => item.result === "fail");
  const hasPending = input.inspection.items.some((item) => item.result === "pending");

  return {
    reportId: input.reportId,
    inspectionId: input.inspectionId,
    buildingId: input.inspection.buildingId,
    customerId: building.customerId,
    certificateNumber: input.certificateNumber,
    reportTemplateKey: input.reportTemplateKey,
    inspectionType: input.inspection.inspectionType.name,
    inspectionTypeCode: input.inspection.inspectionType.code,
    overallPass: !hasFail && !hasPending,
    completedAt: input.inspection.completedAt?.toISOString() ?? null,
    publicReportUrl: publicReportUrl(input.shareToken),
    publicReportPdfUrl: publicReportPdfUrl(input.shareToken),
    jurisdiction: jurisdiction
      ? {
          id: jurisdiction.id,
          code: jurisdiction.code,
          name: jurisdiction.name,
          reportTemplateKey: jurisdiction.reportTemplateKey,
        }
      : null,
    fireDistrict: building.fireDistrict,
    permitNumber: building.permitNumber,
    permitExpiresAt: building.permitExpiresAt?.toISOString() ?? null,
    buildingName: building.name,
    buildingAddress: `${building.addressLine1}, ${building.city}`,
  };
}
