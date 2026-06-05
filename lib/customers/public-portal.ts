import { InspectionStatus, ReportStatus } from "@prisma/client";
import {
  resolvePublicCompanyBranding,
  type PublicCompanyBranding,
} from "@/lib/companies/public-branding";
import { buildingLabel } from "@/lib/customers/format";
import {
  portalScheduleMaxDate,
  portalScheduleMinDate,
} from "@/lib/customers/portal-schedule";
import { prisma } from "@/lib/prisma";

export type PublicCustomerPortalMeta = {
  portalToken: string;
  customerId: string;
  customerName: string;
  companyName: string;
  branding: PublicCompanyBranding;
  inspectionTypes: { id: string; name: string }[];
  scheduleMinDate: string;
  scheduleMaxDate: string;
  upcomingVisits: {
    id: string;
    buildingLabel: string;
    inspectionTypeName: string;
    scheduledAt: Date;
    assignedTechnicianName: string | null;
  }[];
  buildings: {
    id: string;
    label: string;
    reports: {
      shareToken: string;
      title: string;
      completedAt: Date;
      inspectionTypeName: string;
    }[];
  }[];
};

export async function getPublicCustomerPortalMeta(
  portalToken: string,
): Promise<PublicCustomerPortalMeta | null> {
  const now = new Date();

  const customer = await prisma.customer.findFirst({
    where: { portalToken },
    select: {
      id: true,
      name: true,
      portalEnabledAt: true,
      companyId: true,
      company: {
        select: { name: true, logoUrl: true, reportPhone: true, reportEmail: true },
      },
      buildings: {
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          inspections: {
            where: { status: InspectionStatus.completed },
            select: {
              completedAt: true,
              inspectionType: { select: { name: true } },
              reports: {
                where: {
                  status: ReportStatus.finalized,
                  shareToken: { not: null },
                },
                select: {
                  shareToken: true,
                  title: true,
                  generatedAt: true,
                },
                orderBy: { generatedAt: "desc" },
                take: 5,
              },
            },
            orderBy: { completedAt: "desc" },
          },
        },
        orderBy: { addressLine1: "asc" },
      },
    },
  });

  if (!customer?.portalEnabledAt) return null;

  const inspectionTypes = await prisma.inspectionType.findMany({
    where: { companyId: customer.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const upcomingInspections = await prisma.inspection.findMany({
    where: {
      status: InspectionStatus.scheduled,
      scheduledAt: { gte: now },
      building: { customerId: customer.id },
    },
    select: {
      id: true,
      scheduledAt: true,
      inspectionType: { select: { name: true } },
      assignedTo: { select: { name: true } },
      building: {
        select: { name: true, addressLine1: true, city: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  const upcomingVisits = upcomingInspections.map((inspection) => ({
    id: inspection.id,
    buildingLabel: buildingLabel(inspection.building),
    inspectionTypeName: inspection.inspectionType.name,
    scheduledAt: inspection.scheduledAt,
    assignedTechnicianName: inspection.assignedTo?.name?.trim() || null,
  }));

  const buildings = customer.buildings.map((building) => {
    const reports: PublicCustomerPortalMeta["buildings"][number]["reports"] = [];
    for (const inspection of building.inspections) {
      if (!inspection.completedAt) continue;
      for (const report of inspection.reports) {
        if (!report.shareToken) continue;
        reports.push({
          shareToken: report.shareToken,
          title:
            report.title ??
            `${inspection.inspectionType.name} — ${customer.name}`,
          completedAt: inspection.completedAt,
          inspectionTypeName: inspection.inspectionType.name,
        });
      }
    }

    return {
      id: building.id,
      label: buildingLabel(building),
      reports: reports.slice(0, 8),
    };
  });

  return {
    portalToken,
    customerId: customer.id,
    customerName: customer.name,
    companyName: customer.company.name,
    branding: resolvePublicCompanyBranding(customer.company),
    inspectionTypes,
    scheduleMinDate: portalScheduleMinDate(now),
    scheduleMaxDate: portalScheduleMaxDate(now),
    upcomingVisits,
    buildings,
  };
}
