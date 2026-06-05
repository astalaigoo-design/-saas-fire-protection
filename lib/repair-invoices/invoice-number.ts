import type { Prisma } from "@prisma/client";

const DEFAULT_PREFIX = "INV-";

export function formatRepairInvoiceNumber(prefix: string | null, sequence: number): string {
  const normalizedPrefix = prefix?.trim() || DEFAULT_PREFIX;
  return `${normalizedPrefix}${String(sequence).padStart(4, "0")}`;
}

type InvoiceNumberTx = Pick<
  Prisma.TransactionClient,
  "company"
>;

export async function allocateRepairInvoiceNumber(
  tx: InvoiceNumberTx,
  companyId: string,
): Promise<string> {
  const company = await tx.company.findUniqueOrThrow({
    where: { id: companyId },
    select: {
      repairInvoiceNumberPrefix: true,
      nextRepairInvoiceNumber: true,
    },
  });

  const sequence = company.nextRepairInvoiceNumber;
  await tx.company.update({
    where: { id: companyId },
    data: { nextRepairInvoiceNumber: sequence + 1 },
  });

  return formatRepairInvoiceNumber(company.repairInvoiceNumberPrefix, sequence);
}

export function defaultRepairInvoiceDueAt(from: Date = new Date()): Date {
  const due = new Date(from);
  due.setDate(due.getDate() + 30);
  return due;
}
