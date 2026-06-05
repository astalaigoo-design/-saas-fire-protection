import type { Prisma } from "@prisma/client";

export function formatCertificateNumber(input: {
  prefix: string | null;
  year: number;
  sequence: number;
}): string {
  const prefix = input.prefix?.trim() ?? "";
  const padded = String(input.sequence).padStart(5, "0");
  return prefix ? `${prefix}${input.year}-${padded}` : `${input.year}-${padded}`;
}

type AllocateInput = {
  companyId: string;
  jurisdictionId: string | null;
  issuedAt?: Date;
};

export async function allocateCertificateNumber(
  tx: Prisma.TransactionClient,
  input: AllocateInput,
): Promise<string> {
  const year = (input.issuedAt ?? new Date()).getFullYear();

  if (input.jurisdictionId) {
    const jurisdiction = await tx.jurisdiction.update({
      where: { id: input.jurisdictionId, companyId: input.companyId },
      data: { nextCertificateNumber: { increment: 1 } },
      select: {
        nextCertificateNumber: true,
        certificatePrefix: true,
      },
    });

    return formatCertificateNumber({
      prefix: jurisdiction.certificatePrefix,
      year,
      sequence: jurisdiction.nextCertificateNumber,
    });
  }

  const company = await tx.company.update({
    where: { id: input.companyId },
    data: { nextCertificateNumber: { increment: 1 } },
    select: {
      nextCertificateNumber: true,
      certificateNumberPrefix: true,
    },
  });

  return formatCertificateNumber({
    prefix: company.certificateNumberPrefix,
    year,
    sequence: company.nextCertificateNumber,
  });
}
