import { DeficiencyStatus, QuoteStatus, WorkOrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  deriveAssetServiceStatus,
  derivePipelineStage,
  type RepairPipelineWorkOrder,
} from "@/lib/operations/repair-pipeline";

const workOrder = (status: WorkOrderStatus): RepairPipelineWorkOrder => ({
  id: "wo1",
  title: "Replace valve",
  status,
  scheduledAt: null,
  completedAt: null,
});

describe("derivePipelineStage", () => {
  it("prioritizes verified and awaiting verification", () => {
    expect(
      derivePipelineStage({
        deficiencyStatus: DeficiencyStatus.verified,
        quoteStatus: QuoteStatus.draft,
        scheduledInspectionId: null,
        activeWorkOrder: workOrder(WorkOrderStatus.scheduled),
      }).stage,
    ).toBe("verified");

    expect(
      derivePipelineStage({
        deficiencyStatus: DeficiencyStatus.resolved,
        quoteStatus: QuoteStatus.sent,
        scheduledInspectionId: null,
        activeWorkOrder: null,
      }).stage,
    ).toBe("awaiting_verification");
  });

  it("surfaces active work orders before quote stages", () => {
    expect(
      derivePipelineStage({
        deficiencyStatus: DeficiencyStatus.owned,
        quoteStatus: QuoteStatus.sent,
        scheduledInspectionId: null,
        activeWorkOrder: workOrder(WorkOrderStatus.in_progress),
      }).stage,
    ).toBe("work_order");
  });

  it("tracks quote progression", () => {
    expect(
      derivePipelineStage({
        deficiencyStatus: DeficiencyStatus.open,
        quoteStatus: QuoteStatus.draft,
        scheduledInspectionId: null,
        activeWorkOrder: null,
      }).stage,
    ).toBe("quote_draft");

    expect(
      derivePipelineStage({
        deficiencyStatus: DeficiencyStatus.open,
        quoteStatus: QuoteStatus.accepted,
        scheduledInspectionId: "job1",
        activeWorkOrder: null,
      }).stage,
    ).toBe("follow_up_scheduled");
  });
});

describe("deriveAssetServiceStatus", () => {
  it("marks register updated when last service is after the failing inspection", () => {
    expect(
      deriveAssetServiceStatus({
        deficiencyStatus: DeficiencyStatus.owned,
        linkedAsset: { lastServiceAt: new Date("2026-06-10") },
        sourceCompletedAt: new Date("2026-06-01"),
      }),
    ).toBe("updated");
  });

  it("returns not_linked when checklist has no linked tag", () => {
    expect(
      deriveAssetServiceStatus({
        deficiencyStatus: DeficiencyStatus.open,
        linkedAsset: null,
        sourceCompletedAt: new Date("2026-06-01"),
      }),
    ).toBe("not_linked");
  });
});
