import { InspectionItemResult, InspectionStatus } from "@prisma/client";
import type { CommandCenterSnapshot } from "@/lib/operations/queries";
import type { AutomationVisibility } from "@/lib/operations/automation-visibility";
import type { InspectionFormData } from "@/lib/inspect/queries";

export const marketingInspectionPreview: InspectionFormData = {
  id: "marketing-preview-inspection",
  status: InspectionStatus.in_progress,
  scheduledAt: new Date("2026-06-01T09:00:00Z"),
  completedAt: null,
  signatureData: null,
  signedAt: null,
  notes: null,
  building: {
    name: "Riverside Medical — Building A",
    addressLine1: "1200 Market Street",
    addressLine2: null,
    city: "San Francisco",
    region: "CA",
    postalCode: "94102",
    customer: { name: "Riverside Medical Group" },
  },
  inspectionType: { name: "Monthly fire sprinkler" },
  items: [
    {
      id: "item-1",
      label: "Sprinkler heads free of obstruction",
      description: "NFPA 25 (2023) §5.2.1 — Maintain clearance below deflectors per §5.2.1.1.1.",
      sortOrder: 1,
      result: InspectionItemResult.pass,
      notes: null,
    },
    {
      id: "item-2",
      label: "Gauges in operable range",
      description: "NFPA 25 (2023) §5.2.4 — Dry pipe gauges readable and in range.",
      sortOrder: 2,
      result: null,
      notes: null,
    },
    {
      id: "item-3",
      label: "Alarm devices free of damage",
      description: "NFPA 25 (2023) §5.2.5 — No physical damage or corrosion.",
      sortOrder: 3,
      result: null,
      notes: null,
    },
  ],
  photos: [],
};

export const marketingCommandCenterPreview: CommandCenterSnapshot = {
  dueByCadence: {
    monthly: [
      {
        buildingId: "b1",
        buildingLabel: "Riverside Medical — Building A",
        customerName: "Riverside Medical Group",
        inspectionTypeCode: "monthly",
        inspectionTypeName: "Monthly fire sprinkler",
        status: "overdue",
        dueAt: new Date("2026-05-28T00:00:00Z"),
        lastCompletedAt: new Date("2026-04-28T00:00:00Z"),
        scheduledInspectionId: "insp-1",
      },
      {
        buildingId: "b2",
        buildingLabel: "Harborview Office Park",
        customerName: "Harborview Properties",
        inspectionTypeCode: "monthly",
        inspectionTypeName: "Monthly fire sprinkler",
        status: "due_soon",
        dueAt: new Date("2026-06-10T00:00:00Z"),
        lastCompletedAt: new Date("2026-05-10T00:00:00Z"),
        scheduledInspectionId: "insp-2",
      },
    ],
    quarterly: [],
    annual: [],
  },
  dueTotals: { overdue: 2, dueSoon: 4, neverInspected: 1 },
  deficiencies: [
    {
      id: "def-1",
      label: "Gauges in operable range",
      description: "NFPA 25 §5.2.4",
      notes: "Gauge below operable range on dry pipe riser.",
      buildingId: "b1",
      buildingLabel: "Riverside Medical — Building A",
      customerName: "Riverside Medical Group",
      inspectionId: "insp-done",
      inspectionTypeName: "Monthly fire sprinkler",
      completedAt: new Date("2026-05-20T00:00:00Z"),
      quoteId: "quote-1",
      quoteStatus: "draft",
    },
  ],
  pendingQuotes: [
    {
      id: "quote-1",
      title: "Sprinkler gauge repair",
      totalCents: 124_000,
      currency: "USD",
      buildingId: "b1",
      buildingLabel: "Riverside Medical — Building A",
      customerName: "Riverside Medical Group",
      inspectionId: "insp-done",
      lineItemCount: 3,
      createdAt: new Date("2026-05-21T00:00:00Z"),
    },
  ],
  reportsSentThisMonth: [
    {
      id: "rep-1",
      title: "Monthly sprinkler compliance report",
      buildingId: "b2",
      buildingLabel: "Harborview Office Park",
      customerName: "Harborview Properties",
      inspectionId: "insp-3",
      sentAt: new Date("2026-05-18T00:00:00Z"),
      sentTo: "facilities@harborview.example",
    },
  ],
  summary: {
    openDeficiencies: 1,
    pendingQuotes: 1,
    reportsSentThisMonth: 3,
  },
};

export const marketingAutomationPreview: AutomationVisibility = {
  dueRemindersSentCount: 12,
  trialRemindersSentCount: 0,
  lastDueRemindersRunAt: new Date("2026-06-02T13:00:00.000Z"),
  lastDueRemindersRunSent: 2,
  lastTrialRemindersRunAt: null,
  lastTrialRemindersRunSent: null,
  lastDueReminderSentAt: new Date("2026-05-28T13:00:00.000Z"),
  recentDueReminders: [
    {
      id: "rem-1",
      createdAt: new Date("2026-05-28T13:00:00.000Z"),
      buildingLabel: "Riverside Medical — Building A",
      inspectionTypeName: "Annual fire sprinkler",
      dueAt: "2026-06-04T00:00:00.000Z",
      sentTo: "service@bayareafire.example",
    },
    {
      id: "rem-2",
      createdAt: new Date("2026-05-21T13:00:00.000Z"),
      buildingLabel: "Harborview Office Park",
      inspectionTypeName: "Monthly fire sprinkler",
      dueAt: "2026-05-28T00:00:00.000Z",
      sentTo: "service@bayareafire.example",
    },
  ],
  leadDays: 7,
};

export const marketingPublicReportPreview = {
  buildingLabel: "Riverside Medical — Building A",
  customerName: "Riverside Medical Group",
  companyName: "Bay Area Fire Protection",
  inspectionTypeName: "Monthly fire sprinkler",
  completedAt: new Date("2026-05-20T00:00:00Z"),
  overallPass: false,
  branding: {
    companyName: "Bay Area Fire Protection",
    logoUrl: null,
    reportEmail: "service@bayareafire.example",
    reportPhone: "(415) 555-0142",
  } as const,
};
