import {
  AssetType,
  DeficiencyStatus,
  InspectionItemResult,
  InspectionStatus,
  QuoteStatus,
  WorkOrderStatus,
} from "@prisma/client";
import { assetTypeLabel } from "@/lib/assets/constants";
import type { InspectionFormData } from "@/lib/inspect/queries";
import type { AutomationVisibility } from "@/lib/operations/automation-visibility";
import {
  filterDueAssetsByType,
  groupDueAssetsByType,
  type DueAssetRow,
} from "@/lib/operations/due-assets";
import type { CommandCenterSnapshot } from "@/lib/operations/queries";
import type { RepairPipelineSnapshot } from "@/lib/operations/repair-pipeline";
import type { QuotePipelineMetrics } from "@/lib/quotes/pipeline";

/** Parse fixed ISO timestamps once at module load (marketing screenshots only). */
const utc = (iso: string): Date => new Date(iso);

const INSPECTION_TYPE = "Monthly fire sprinkler";

const SITES = {
  riverside: {
    buildingId: "b1",
    buildingLabel: "Riverside Medical — Building A",
    customerName: "Riverside Medical Group",
    address: {
      name: "Riverside Medical — Building A",
      addressLine1: "1200 Market Street",
      addressLine2: null,
      city: "San Francisco",
      region: "CA",
      postalCode: "94102",
    },
  },
  harborview: {
    buildingId: "b2",
    buildingLabel: "Harborview Office Park",
    customerName: "Harborview Properties",
  },
  oakWarehouse: {
    buildingId: "b3",
    buildingLabel: "Oak Street Warehouse",
    customerName: "Harborview Properties",
  },
} as const;

const DATES = {
  apr28: utc("2026-04-28T00:00:00Z"),
  may10: utc("2026-05-10T00:00:00Z"),
  may18: utc("2026-05-18T00:00:00Z"),
  may20: utc("2026-05-20T00:00:00Z"),
  may21: utc("2026-05-21T00:00:00Z"),
  may28: utc("2026-05-28T00:00:00Z"),
  may30: utc("2026-05-30T00:00:00Z"),
  june1Morning: utc("2026-06-01T09:00:00Z"),
  june1Arrival: utc("2026-06-01T09:05:00Z"),
  june3: utc("2026-06-03T00:00:00Z"),
  june10: utc("2026-06-10T00:00:00Z"),
  june12: utc("2026-06-12T09:00:00Z"),
  apr15: utc("2026-04-15T00:00:00Z"),
  july20: utc("2026-07-20T00:00:00Z"),
  serviceDueOverdue: utc("2026-05-20T00:00:00Z"),
  lastService: utc("2025-05-20T00:00:00Z"),
  dueRemindersRun: utc("2026-06-02T13:00:00.000Z"),
  dueReminderSent: utc("2026-05-28T13:00:00.000Z"),
} as const;

const TECHNICIAN = { id: "user-tech", name: "Jordan Lee" } as const;

const COMPANY = {
  name: "Bay Area Fire Protection",
  reportEmail: "service@bayareafire.example",
  reportPhone: "(415) 555-0142",
} as const;

function checklistItem(
  id: string,
  sortOrder: number,
  label: string,
  description: string,
  result: InspectionItemResult,
): InspectionFormData["items"][number] {
  return { id, sortOrder, label, description, result, notes: null, linkedTagNumber: null };
}

const previewOverdueExtinguisher: DueAssetRow = {
  assetId: "asset-1",
  assetType: AssetType.fire_extinguisher,
  assetTypeLabel: assetTypeLabel(AssetType.fire_extinguisher),
  tagNumber: "FE-12",
  location: "Lobby",
  buildingId: SITES.riverside.buildingId,
  buildingLabel: SITES.riverside.buildingLabel,
  customerName: SITES.riverside.customerName,
  status: "overdue",
  nextServiceDue: DATES.serviceDueOverdue,
  lastServiceAt: DATES.lastService,
};

const previewDueAssetRows = [previewOverdueExtinguisher];

function previewDueAssets(): CommandCenterSnapshot["dueAssets"] {
  return {
    rows: previewDueAssetRows,
    extinguishers: filterDueAssetsByType(previewDueAssetRows, AssetType.fire_extinguisher),
    byType: groupDueAssetsByType(previewDueAssetRows),
    totals: {
      equipmentOverdue: 1,
      equipmentDueThisMonth: 2,
      extinguishersOverdue: 1,
      extinguishersDueThisMonth: 1,
    },
    waterSystems: {
      fire_hydrant: { overdue: 1, dueThisMonth: 0 },
      standpipe: { overdue: 0, dueThisMonth: 1 },
      sprinkler_component: { overdue: 0, dueThisMonth: 1 },
      attentionTotal: 3,
    },
    serviceMonthLabel: "June 2026",
  };
}

const previewWorkOrder = {
  id: "wo-1",
  title: "Replace dry pipe gauge",
  status: WorkOrderStatus.scheduled,
  scheduledAt: DATES.june12,
  completedAt: null,
} as const;

export const marketingInspectionPreview = {
  id: "marketing-preview-inspection",
  buildingId: "marketing-preview-building",
  status: InspectionStatus.in_progress,
  scheduledAt: DATES.june1Morning,
  startedAt: DATES.june1Arrival,
  arrivedAt: DATES.june1Arrival,
  arrivalLatitude: 37.7749,
  arrivalLongitude: -122.4194,
  arrivalAccuracyMeters: 12,
  completedAt: null,
  submitLatitude: null,
  submitLongitude: null,
  submitAccuracyMeters: null,
  mileageMiles: null,
  signatureData: null,
  signedAt: null,
  notes: null,
  building: {
    ...SITES.riverside.address,
    customer: { name: SITES.riverside.customerName },
  },
  inspectionType: { name: INSPECTION_TYPE },
  items: [
    checklistItem(
      "item-1",
      1,
      "Sprinkler heads free of obstruction",
      "NFPA 25 (2023) §5.2.1 — Maintain clearance below deflectors per §5.2.1.1.1.",
      InspectionItemResult.pass,
    ),
    checklistItem(
      "item-2",
      2,
      "Gauges in operable range",
      "NFPA 25 (2023) §5.2.4 — Dry pipe gauges readable and in range.",
      InspectionItemResult.pending,
    ),
    checklistItem(
      "item-3",
      3,
      "Alarm devices free of damage",
      "NFPA 25 (2023) §5.2.5 — No physical damage or corrosion.",
      InspectionItemResult.pending,
    ),
  ],
  photos: [],
  assetChecks: [],
} satisfies InspectionFormData;

export const marketingCommandCenterPreview: CommandCenterSnapshot = {
  dueByCadence: {
    monthly: [
      {
        buildingId: SITES.riverside.buildingId,
        buildingLabel: SITES.riverside.buildingLabel,
        customerName: SITES.riverside.customerName,
        inspectionTypeCode: "monthly",
        inspectionTypeName: INSPECTION_TYPE,
        status: "overdue",
        dueAt: DATES.may28,
        lastCompletedAt: DATES.apr28,
        scheduledInspectionId: "insp-1",
      },
      {
        buildingId: SITES.harborview.buildingId,
        buildingLabel: SITES.harborview.buildingLabel,
        customerName: SITES.harborview.customerName,
        inspectionTypeCode: "monthly",
        inspectionTypeName: INSPECTION_TYPE,
        status: "due_soon",
        dueAt: DATES.june10,
        lastCompletedAt: DATES.may10,
        scheduledInspectionId: "insp-2",
      },
    ],
    quarterly: [],
    annual: [],
  },
  dueTotals: { overdue: 2, dueSoon: 4, neverInspected: 1 },
  dueAssets: previewDueAssets(),
  importHealth: {
    buildingsInScope: 24,
    buildingsWithoutRegister: 3,
    activeAssets: 180,
    assetsMissingNextDue: 12,
    recentImports: {
      customers: 8,
      buildings: 22,
      equipment: 140,
      scheduleJobs: 18,
    },
    lastImportAt: DATES.may30,
    registerGaps: [
      {
        buildingId: SITES.oakWarehouse.buildingId,
        buildingLabel: SITES.oakWarehouse.buildingLabel,
        customerName: SITES.oakWarehouse.customerName,
      },
    ],
  },
  deficiencies: [
    {
      id: "def-1",
      label: "Gauges in operable range",
      description: "NFPA 25 §5.2.4",
      notes: "Gauge below operable range on dry pipe riser.",
      status: "owned",
      dueAt: DATES.june3,
      createdAt: DATES.may20,
      resolvedAt: null,
      verifiedAt: null,
      buildingId: SITES.riverside.buildingId,
      buildingLabel: SITES.riverside.buildingLabel,
      customerName: SITES.riverside.customerName,
      sourceInspectionId: "insp-done",
      inspectionTypeName: INSPECTION_TYPE,
      sourceCompletedAt: DATES.may20,
      assignedTo: TECHNICIAN,
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
      buildingId: SITES.riverside.buildingId,
      buildingLabel: SITES.riverside.buildingLabel,
      customerName: SITES.riverside.customerName,
      inspectionId: "insp-done",
      lineItemCount: 3,
      createdAt: DATES.may21,
    },
  ],
  reportsSentThisMonth: [
    {
      id: "rep-1",
      title: "Monthly sprinkler compliance report",
      buildingId: SITES.harborview.buildingId,
      buildingLabel: SITES.harborview.buildingLabel,
      customerName: SITES.harborview.customerName,
      inspectionId: "insp-3",
      sentAt: DATES.may18,
      sentTo: "facilities@harborview.example",
    },
  ],
  permits: {
    rows: [
      {
        buildingId: SITES.riverside.buildingId,
        buildingLabel: SITES.riverside.buildingLabel,
        customerName: SITES.riverside.customerName,
        fireDistrict: "San Mateo County Fire",
        permitNumber: "SP-2023-014",
        permitExpiresAt: DATES.apr15,
        status: "expired",
      },
      {
        buildingId: SITES.harborview.buildingId,
        buildingLabel: SITES.harborview.buildingLabel,
        customerName: SITES.harborview.customerName,
        fireDistrict: "Oakland Fire",
        permitNumber: "SP-2025-088",
        permitExpiresAt: DATES.july20,
        status: "expiring_soon",
      },
    ],
    totals: {
      missing: 1,
      expired: 1,
      expiringSoon: 1,
      noExpiryDate: 0,
      current: 21,
      needsAttention: 3,
    },
  },
  summary: {
    openDeficiencies: 1,
    pendingQuotes: 1,
    reportsSentThisMonth: 3,
    equipmentOverdue: 1,
    equipmentDueThisMonth: 2,
    buildingsWithoutRegister: 3,
    assetsMissingNextDue: 12,
    csvImportsLast90Days: 188,
    permitsNeedAttention: 3,
    waterSystemTestsDue: 3,
    openWorkOrders: 2,
  },
  workOrders: {
    open: [
      {
        id: previewWorkOrder.id,
        title: previewWorkOrder.title,
        status: previewWorkOrder.status,
        scheduledAt: previewWorkOrder.scheduledAt,
        completedAt: previewWorkOrder.completedAt,
        createdAt: utc("2026-06-01T00:00:00Z"),
        building: {
          id: SITES.riverside.buildingId,
          name: "Building A",
          addressLine1: "100 Main",
          city: "Boston",
          customer: { name: SITES.riverside.customerName },
        },
        assignedTo: TECHNICIAN,
        buildingLabel: SITES.riverside.buildingLabel,
      },
    ],
    openCount: 2,
  },
};

export const marketingRepairPipelinePreview: RepairPipelineSnapshot = {
  rows: [
    {
      deficiencyId: "def-1",
      label: "Gauges in operable range",
      description: "NFPA 25 §5.2.4",
      deficiencyStatus: DeficiencyStatus.owned,
      dueAt: DATES.june3,
      buildingId: SITES.riverside.buildingId,
      buildingLabel: SITES.riverside.buildingLabel,
      customerName: SITES.riverside.customerName,
      inspectionTypeName: INSPECTION_TYPE,
      sourceInspectionId: "insp-done",
      sourceCompletedAt: DATES.may20,
      verifiedAt: null,
      quoteId: "quote-1",
      quoteStatus: QuoteStatus.draft,
      quoteTitle: "Sprinkler gauge repair",
      quoteTotalCents: 124_000,
      quoteCurrency: "USD",
      scheduledInspectionId: null,
      workOrders: [previewWorkOrder],
      activeWorkOrder: previewWorkOrder,
      linkedAsset: {
        id: previewOverdueExtinguisher.assetId,
        tagNumber: previewOverdueExtinguisher.tagNumber,
        assetTypeLabel: previewOverdueExtinguisher.assetTypeLabel,
        lastServiceAt: previewOverdueExtinguisher.lastServiceAt,
      },
      assetServiceStatus: "pending",
      pipelineStage: "work_order",
      pipelineStageLabel: "Work order scheduled",
      isClosed: false,
    },
  ],
  totals: {
    active: 1,
    awaitingQuote: 0,
    quoteInFlight: 1,
    workOrderOpen: 1,
    awaitingVerification: 0,
    verifiedRecently: 0,
  },
};

export const marketingQuotePipelineMetrics: QuotePipelineMetrics = {
  openPipelineCents: 213_000,
  draftCents: 124_000,
  sentCents: 89_000,
  acceptedCents: 45_000,
  conversionPercent: 67,
  counts: {
    all: 4,
    draft: 1,
    awaiting: 1,
    awaitingChanges: 0,
    accepted: 2,
    acceptedNeedsSchedule: 1,
    declined: 1,
  },
};

export const marketingAutomationPreview: AutomationVisibility = {
  dueRemindersSentCount: 12,
  trialRemindersSentCount: 0,
  lastDueRemindersRunAt: DATES.dueRemindersRun,
  lastDueRemindersRunSent: 2,
  lastTrialRemindersRunAt: null,
  lastTrialRemindersRunSent: null,
  lastDueReminderSentAt: DATES.dueReminderSent,
  recentDueReminders: [
    {
      id: "rem-1",
      createdAt: DATES.dueReminderSent,
      buildingLabel: SITES.riverside.buildingLabel,
      inspectionTypeName: "Annual fire sprinkler",
      dueAt: "2026-06-04T00:00:00.000Z",
      sentTo: COMPANY.reportEmail,
    },
    {
      id: "rem-2",
      createdAt: utc("2026-05-21T13:00:00.000Z"),
      buildingLabel: SITES.harborview.buildingLabel,
      inspectionTypeName: INSPECTION_TYPE,
      dueAt: "2026-05-28T00:00:00.000Z",
      sentTo: COMPANY.reportEmail,
    },
  ],
  leadDays: 7,
};

export const marketingPublicReportPreview = {
  buildingLabel: SITES.riverside.buildingLabel,
  customerName: SITES.riverside.customerName,
  companyName: COMPANY.name,
  inspectionTypeName: INSPECTION_TYPE,
  completedAt: DATES.may20,
  overallPass: false,
  branding: {
    companyName: COMPANY.name,
    logoUrl: null,
    reportEmail: COMPANY.reportEmail,
    reportPhone: COMPANY.reportPhone,
  },
} as const;
