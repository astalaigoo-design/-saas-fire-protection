import {
  DeficiencyStatus,
  QuoteStatus,
  WorkOrderStatus,
  type AssetType,
} from "@prisma/client";
import {
  branchScopeFromSession,
  buildingWhereFromScope,
} from "@/lib/branches/scope";
import { assetTypeLabel } from "@/lib/assets/constants";
import { buildAssetScanIndex, normalizeScanValue } from "@/lib/assets/scan-match";
import { buildingLabel } from "@/lib/customers/format";
import { OPEN_DEFICIENCY_STATUSES } from "@/lib/deficiencies/status";
import { backfillDeficienciesForCompany } from "@/lib/deficiencies/create-from-inspection";
import type { DashboardSession } from "@/lib/dashboard/session";
import { OPEN_WORK_ORDER_STATUSES } from "@/lib/work-orders/constants";
import { prisma } from "@/lib/prisma";

export type RepairPipelineStage =
  | "deficiency"
  | "quote_draft"
  | "quote_sent"
  | "quote_accepted"
  | "follow_up_scheduled"
  | "work_order"
  | "awaiting_verification"
  | "verified";

export type AssetServiceStatus = "updated" | "pending" | "not_linked" | "not_applicable";

export type RepairPipelineWorkOrder = {
  id: string;
  title: string;
  status: WorkOrderStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
};

export type RepairPipelineRow = {
  deficiencyId: string;
  label: string;
  description: string | null;
  deficiencyStatus: DeficiencyStatus;
  dueAt: Date | null;
  buildingId: string;
  buildingLabel: string;
  customerName: string;
  inspectionTypeName: string;
  sourceInspectionId: string;
  sourceCompletedAt: Date | null;
  verifiedAt: Date | null;
  quoteId: string | null;
  quoteStatus: QuoteStatus | null;
  quoteTitle: string | null;
  quoteTotalCents: number | null;
  quoteCurrency: string | null;
  scheduledInspectionId: string | null;
  workOrders: RepairPipelineWorkOrder[];
  activeWorkOrder: RepairPipelineWorkOrder | null;
  linkedAsset: {
    id: string;
    tagNumber: string | null;
    assetTypeLabel: string;
    lastServiceAt: Date | null;
  } | null;
  assetServiceStatus: AssetServiceStatus;
  pipelineStage: RepairPipelineStage;
  pipelineStageLabel: string;
  isClosed: boolean;
};

export type RepairPipelineSnapshot = {
  rows: RepairPipelineRow[];
  totals: {
    active: number;
    awaitingQuote: number;
    quoteInFlight: number;
    workOrderOpen: number;
    awaitingVerification: number;
    verifiedRecently: number;
  };
};

const pipelineSelect = {
  id: true,
  label: true,
  description: true,
  status: true,
  dueAt: true,
  verifiedAt: true,
  buildingId: true,
  sourceInspectionId: true,
  inspectionItem: { select: { linkedTagNumber: true } },
  workOrders: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      title: true,
      status: true,
      scheduledAt: true,
      completedAt: true,
    },
  },
  sourceInspection: {
    select: {
      completedAt: true,
      inspectionType: { select: { name: true } },
      building: {
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true } },
        },
      },
      quote: {
        select: {
          id: true,
          status: true,
          title: true,
          totalCents: true,
          currency: true,
          scheduledInspectionId: true,
        },
      },
    },
  },
} as const;

type PipelineQueryRow = {
  id: string;
  label: string;
  description: string | null;
  status: DeficiencyStatus;
  dueAt: Date | null;
  verifiedAt: Date | null;
  buildingId: string;
  sourceInspectionId: string;
  inspectionItem: { linkedTagNumber: string | null };
  workOrders: RepairPipelineWorkOrder[];
  sourceInspection: {
    completedAt: Date | null;
    inspectionType: { name: string };
    building: {
      id: string;
      name: string | null;
      addressLine1: string;
      city: string;
      customer: { name: string };
    };
    quote: {
      id: string;
      status: QuoteStatus;
      title: string | null;
      totalCents: number;
      currency: string;
      scheduledInspectionId: string | null;
    } | null;
  };
};

export function derivePipelineStage(input: {
  deficiencyStatus: DeficiencyStatus;
  quoteStatus: QuoteStatus | null;
  scheduledInspectionId: string | null;
  activeWorkOrder: RepairPipelineWorkOrder | null;
}): { stage: RepairPipelineStage; label: string; isClosed: boolean } {
  if (input.deficiencyStatus === DeficiencyStatus.verified) {
    return { stage: "verified", label: "Verified", isClosed: true };
  }

  if (input.deficiencyStatus === DeficiencyStatus.resolved) {
    return { stage: "awaiting_verification", label: "Awaiting verification", isClosed: false };
  }

  if (input.activeWorkOrder) {
    const woLabel =
      input.activeWorkOrder.status === WorkOrderStatus.in_progress
        ? "Work order in progress"
        : input.activeWorkOrder.status === WorkOrderStatus.scheduled
          ? "Work order scheduled"
          : "Work order draft";
    return { stage: "work_order", label: woLabel, isClosed: false };
  }

  if (input.quoteStatus === QuoteStatus.accepted && input.scheduledInspectionId) {
    return { stage: "follow_up_scheduled", label: "Follow-up scheduled", isClosed: false };
  }

  if (input.quoteStatus === QuoteStatus.accepted) {
    return { stage: "quote_accepted", label: "Quote accepted", isClosed: false };
  }

  if (input.quoteStatus === QuoteStatus.sent) {
    return { stage: "quote_sent", label: "Quote sent", isClosed: false };
  }

  if (input.quoteStatus === QuoteStatus.draft) {
    return { stage: "quote_draft", label: "Quote draft", isClosed: false };
  }

  return { stage: "deficiency", label: "Deficiency open", isClosed: false };
}

export function deriveAssetServiceStatus(input: {
  deficiencyStatus: DeficiencyStatus;
  linkedAsset: { lastServiceAt: Date | null } | null;
  sourceCompletedAt: Date | null;
}): AssetServiceStatus {
  if (input.deficiencyStatus === DeficiencyStatus.verified && !input.linkedAsset) {
    return "not_applicable";
  }

  if (!input.linkedAsset) return "not_linked";

  if (!input.sourceCompletedAt || !input.linkedAsset.lastServiceAt) {
    return input.deficiencyStatus === DeficiencyStatus.verified ? "updated" : "pending";
  }

  if (input.linkedAsset.lastServiceAt >= input.sourceCompletedAt) {
    return "updated";
  }

  return "pending";
}

function pickActiveWorkOrder(workOrders: RepairPipelineWorkOrder[]): RepairPipelineWorkOrder | null {
  return (
    workOrders.find((row) => OPEN_WORK_ORDER_STATUSES.includes(row.status)) ??
    workOrders.find((row) => row.status === WorkOrderStatus.completed) ??
    null
  );
}

function resolveLinkedAsset(
  buildingId: string,
  linkedTagNumber: string | null,
  tagIndexByBuilding: Map<string, Map<string, string>>,
  assetById: Map<
    string,
    {
      id: string;
      assetType: AssetType;
      tagNumber: string | null;
      lastServiceAt: Date | null;
    }
  >,
): RepairPipelineRow["linkedAsset"] {
  const tag = linkedTagNumber?.trim();
  if (!tag) return null;

  const tagIndex = tagIndexByBuilding.get(buildingId);
  const assetId = tagIndex?.get(normalizeScanValue(tag));
  if (!assetId) return null;

  const asset = assetById.get(assetId);
  if (!asset) return null;

  return {
    id: asset.id,
    tagNumber: asset.tagNumber,
    assetTypeLabel: assetTypeLabel(asset.assetType),
    lastServiceAt: asset.lastServiceAt,
  };
}

export async function listRepairPipelineRows(
  session: DashboardSession,
): Promise<RepairPipelineSnapshot> {
  await backfillDeficienciesForCompany(session.companyId);

  const scope = branchScopeFromSession(session);
  const buildingWhere = buildingWhereFromScope(scope, session.companyId);
  const verifiedSince = new Date();
  verifiedSince.setDate(verifiedSince.getDate() - 30);

  const [openRows, verifiedRows] = await Promise.all([
    prisma.deficiency.findMany({
      where: {
        companyId: session.companyId,
        status: { in: OPEN_DEFICIENCY_STATUSES },
        building: buildingWhere,
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: pipelineSelect,
    }),
    prisma.deficiency.findMany({
      where: {
        companyId: session.companyId,
        status: DeficiencyStatus.verified,
        verifiedAt: { gte: verifiedSince },
        building: buildingWhere,
      },
      orderBy: { verifiedAt: "desc" },
      take: 15,
      select: pipelineSelect,
    }),
  ]);

  const rows = [...openRows, ...verifiedRows] as PipelineQueryRow[];
  const buildingIds = Array.from(new Set(rows.map((row) => row.buildingId)));

  const assets = buildingIds.length
    ? await prisma.buildingAsset.findMany({
        where: { buildingId: { in: buildingIds }, active: true },
        select: {
          id: true,
          buildingId: true,
          assetType: true,
          tagNumber: true,
          barcodeValue: true,
          lastServiceAt: true,
        },
      })
    : [];

  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const tagIndexByBuilding = new Map<string, Map<string, string>>();

  for (const buildingId of buildingIds) {
    const buildingAssets = assets.filter((asset) => asset.buildingId === buildingId);
    tagIndexByBuilding.set(buildingId, buildAssetScanIndex(buildingAssets));
  }

  const pipelineRows: RepairPipelineRow[] = rows.map((row) => {
    const quote = row.sourceInspection.quote;
    const activeWorkOrder = pickActiveWorkOrder(row.workOrders);
    const { stage, label, isClosed } = derivePipelineStage({
      deficiencyStatus: row.status,
      quoteStatus: quote?.status ?? null,
      scheduledInspectionId: quote?.scheduledInspectionId ?? null,
      activeWorkOrder:
        activeWorkOrder && OPEN_WORK_ORDER_STATUSES.includes(activeWorkOrder.status)
          ? activeWorkOrder
          : null,
    });

    const linkedAsset = resolveLinkedAsset(
      row.buildingId,
      row.inspectionItem.linkedTagNumber,
      tagIndexByBuilding,
      assetById,
    );

    const assetServiceStatus = deriveAssetServiceStatus({
      deficiencyStatus: row.status,
      linkedAsset,
      sourceCompletedAt: row.sourceInspection.completedAt,
    });

    return {
      deficiencyId: row.id,
      label: row.label,
      description: row.description,
      deficiencyStatus: row.status,
      dueAt: row.dueAt,
      buildingId: row.buildingId,
      buildingLabel: buildingLabel(row.sourceInspection.building),
      customerName: row.sourceInspection.building.customer.name,
      inspectionTypeName: row.sourceInspection.inspectionType.name,
      sourceInspectionId: row.sourceInspectionId,
      sourceCompletedAt: row.sourceInspection.completedAt,
      verifiedAt: row.verifiedAt,
      quoteId: quote?.id ?? null,
      quoteStatus: quote?.status ?? null,
      quoteTitle: quote?.title ?? null,
      quoteTotalCents: quote?.totalCents ?? null,
      quoteCurrency: quote?.currency ?? null,
      scheduledInspectionId: quote?.scheduledInspectionId ?? null,
      workOrders: row.workOrders,
      activeWorkOrder,
      linkedAsset,
      assetServiceStatus,
      pipelineStage: stage,
      pipelineStageLabel: label,
      isClosed,
    };
  });

  const seen = new Set<string>();
  const uniqueRows = pipelineRows.filter((row) => {
    if (seen.has(row.deficiencyId)) return false;
    seen.add(row.deficiencyId);
    return true;
  });

  const activeRows = uniqueRows.filter((row) => !row.isClosed);

  return {
    rows: uniqueRows,
    totals: {
      active: activeRows.length,
      awaitingQuote: activeRows.filter((row) => !row.quoteId).length,
      quoteInFlight: activeRows.filter(
        (row) =>
          row.quoteStatus === QuoteStatus.draft || row.quoteStatus === QuoteStatus.sent,
      ).length,
      workOrderOpen: activeRows.filter((row) =>
        row.workOrders.some((wo) => OPEN_WORK_ORDER_STATUSES.includes(wo.status)),
      ).length,
      awaitingVerification: activeRows.filter(
        (row) => row.deficiencyStatus === DeficiencyStatus.resolved,
      ).length,
      verifiedRecently: uniqueRows.filter((row) => row.isClosed).length,
    },
  };
}
