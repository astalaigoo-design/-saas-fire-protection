import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";

export type JurisdictionRow = {
  id: string;
  name: string;
  code: string;
  certificatePrefix: string | null;
  nextCertificateNumber: number;
  reportTemplateKey: string;
  buildingCount: number;
};

export async function listJurisdictionsForCompany(
  companyId: string,
): Promise<JurisdictionRow[]> {
  const rows = await prisma.jurisdiction.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      code: true,
      certificatePrefix: true,
      nextCertificateNumber: true,
      reportTemplateKey: true,
      _count: { select: { buildings: true } },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    certificatePrefix: row.certificatePrefix,
    nextCertificateNumber: row.nextCertificateNumber,
    reportTemplateKey: row.reportTemplateKey,
    buildingCount: row._count.buildings,
  }));
}

export async function listJurisdictionOptions(companyId: string) {
  return prisma.jurisdiction.findMany({
    where: { companyId },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getJurisdictionsSettingsData(session: DashboardSession) {
  const [jurisdictions, company] = await Promise.all([
    listJurisdictionsForCompany(session.companyId),
    prisma.company.findFirst({
      where: { id: session.companyId },
      select: {
        certificateNumberPrefix: true,
        nextCertificateNumber: true,
      },
    }),
  ]);

  return {
    jurisdictions,
    certificateNumberPrefix: company?.certificateNumberPrefix ?? null,
    nextCertificateNumber: company?.nextCertificateNumber ?? 1,
  };
}
