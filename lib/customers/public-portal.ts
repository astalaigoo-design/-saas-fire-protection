import { InspectionStatus, ReportStatus } from "@prisma/client";
import {
  resolvePublicCompanyBranding,
  type PublicCompanyBranding,
} from "@/lib/companies/public-branding";
import { buildingLabel } from "@/lib/customers/format";
import { prisma } from "@/lib/prisma";

export type PublicCustomerPortalMeta = {
  portalToken: string;
  customerId: string;
  customerName: string;
  companyName: string;
  branding: PublicCompanyBranding;
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
  const customer = await prisma.customer.findFirst({
    where: { portalToken },
    select: {
      id: true,
      name: true,
      portalEnabledAt: true,
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
    buildings,
  };
}
