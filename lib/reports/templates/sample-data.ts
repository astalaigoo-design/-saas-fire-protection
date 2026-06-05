import { InspectionItemResult, InspectionStatus, ReportStatus } from "@prisma/client";
import type { ComplianceReportData } from "@/lib/reports/queries";
import type { ReportTemplateKey } from "@/lib/reports/templates/types";

const SAMPLE_COMPLETED = new Date("2026-06-01T14:30:00.000Z");
const SAMPLE_DUE = new Date("2027-06-01T00:00:00.000Z");

export function buildSampleComplianceReportData(
  reportTemplateKey: ReportTemplateKey,
): ComplianceReportData {
  const inspectionTypeByTemplate: Record<
    ReportTemplateKey,
    { name: string; code: string }
  > = {
    default: { name: "Annual inspection", code: "annual" },
    "nfpa25-sprinkler": { name: "Sprinkler system", code: "sprinkler" },
    "nfpa72-alarm": { name: "Fire alarm", code: "alarm" },
    "nfpa96-hood": { name: "Kitchen hood suppression", code: "hood" },
  };

  const itemsByTemplate: Record<ReportTemplateKey, ComplianceReportData["items"]> = {
    default: [
      {
        label: "Means of egress",
        description: "NFPA 101 · 7.1",
        sortOrder: 0,
        result: InspectionItemResult.pass,
        notes: null,
      },
      {
        label: "Emergency lighting",
        description: "NFPA 101 · 7.9",
        sortOrder: 1,
        result: InspectionItemResult.pass,
        notes: null,
      },
    ],
    "nfpa25-sprinkler": [
      {
        label: "Alarm valve tamper switch",
        description: "NFPA 25 · 13.2.6",
        sortOrder: 0,
        result: InspectionItemResult.pass,
        notes: null,
      },
      {
        label: "Main drain test",
        description: "NFPA 25 · 13.2.5",
        sortOrder: 1,
        result: InspectionItemResult.pass,
        notes: null,
      },
    ],
    "nfpa72-alarm": [
      {
        label: "FACP trouble signals",
        description: "NFPA 72 · 14.4.1",
        sortOrder: 0,
        result: InspectionItemResult.pass,
        notes: null,
      },
      {
        label: "Smoke detector sensitivity",
        description: "NFPA 72 · 14.4.5",
        sortOrder: 1,
        result: InspectionItemResult.pass,
        notes: null,
      },
    ],
    "nfpa96-hood": [
      {
        label: "Fusible link condition",
        description: "NFPA 96 · 11.6",
        sortOrder: 0,
        result: InspectionItemResult.pass,
        notes: null,
      },
      {
        label: "Nozzle blow-off caps",
        description: "NFPA 96 · 11.5",
        sortOrder: 1,
        result: InspectionItemResult.pass,
        notes: null,
      },
    ],
  };

  const inspectionType = inspectionTypeByTemplate[reportTemplateKey];

  return {
    id: "sample-inspection",
    status: InspectionStatus.completed,
    scheduledAt: SAMPLE_COMPLETED,
    completedAt: SAMPLE_COMPLETED,
    signedAt: SAMPLE_COMPLETED,
    signatureData: null,
    recurrenceInterval: null,
    notes: null,
    company: {
      name: "Sample Fire Protection Co.",
      logoUrl: null,
      reportEmail: "reports@example.com",
      reportPhone: "(555) 555-0100",
      reportAddress: "100 Main Street\nSample City, ST 12345",
    },
    building: {
      name: "Downtown Kitchen",
      addressLine1: "200 Commerce Blvd",
      addressLine2: null,
      city: "Sample City",
      region: "ST",
      postalCode: "12345",
      fireDistrict: "Sample Fire Department",
      permitNumber: "AHJ-2026-0042",
      permitExpiresAt: SAMPLE_DUE,
      jurisdiction: {
        id: "sample-jurisdiction",
        name: "Sample Fire Department",
        code: "SFD",
        reportTemplateKey,
      },
      customer: {
        name: "Sample Restaurant Group",
        email: "facilities@example.com",
        phone: "(555) 555-0199",
      },
    },
    inspectionType,
    assignedTo: { name: "Alex Technician", email: "tech@example.com" },
    items: itemsByTemplate[reportTemplateKey],
    photos: [],
    inspectorName: "Alex Technician",
    nextInspectionDue: SAMPLE_DUE,
    certificateNumber: "SFD-2026-00001",
    reportTemplateKey,
    jurisdiction: { name: "Sample Fire Department", code: "SFD" },
    summary: {
      pass: 2,
      fail: 0,
      na: 0,
      pending: 0,
      overallPass: true,
    },
  };
}

/** Minimal metadata for sample previews (not persisted). */
export const SAMPLE_REPORT_STATUS = ReportStatus.finalized;
