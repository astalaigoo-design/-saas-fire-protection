import { branchScopeFromSession, repairInvoiceWhereFromScope } from "@/lib/branches/scope";
import { buildingLabel } from "@/lib/customers/format";
import type { DashboardSession } from "@/lib/dashboard/session";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type RepairInvoicePdfLineItem = {
  label: string;
  description: string | null;
  quantity: number;
  unitPriceCents: number;
};

export type RepairInvoicePdfData = {
  invoiceId: string;
  invoiceNumber: string;
  quoteTitle: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  issuedAt: Date;
  dueAt: Date | null;
  companyName: string;
  logoUrl: string | null;
  reportEmail: string | null;
  reportPhone: string | null;
  reportAddress: string | null;
  customerName: string;
  buildingLabel: string;
  inspectionTypeName: string;
  lineItems: RepairInvoicePdfLineItem[];
};

const repairInvoiceListSelect = {
  id: true,
  invoiceNumber: true,
  status: true,
  currency: true,
  totalCents: true,
  issuedAt: true,
  dueAt: true,
  sentTo: true,
  sentAt: true,
  paidAt: true,
  quote: {
    select: {
      id: true,
      title: true,
      status: true,
      inspection: {
        select: {
          inspectionType: { select: { name: true } },
          building: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              customer: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.RepairInvoiceSelect;

export type RepairInvoiceListItem = Prisma.RepairInvoiceGetPayload<{
  select: typeof repairInvoiceListSelect;
}>;

export async function listCompanyRepairInvoices(
  session: DashboardSession,
): Promise<RepairInvoiceListItem[]> {
  const scope = branchScopeFromSession(session);
  return prisma.repairInvoice.findMany({
    where: repairInvoiceWhereFromScope(scope, session.companyId),
    orderBy: { issuedAt: "desc" },
    take: 100,
    select: repairInvoiceListSelect,
  });
}

export async function listCompanyRepairInvoicesSafe(session: DashboardSession): Promise<{
  invoices: RepairInvoiceListItem[];
  schemaReady: boolean;
}> {
  try {
    const invoices = await listCompanyRepairInvoices(session);
    return { invoices, schemaReady: true };
  } catch (error) {
    console.error("listCompanyRepairInvoices failed", error);
    return { invoices: [], schemaReady: false };
  }
}

export async function getRepairInvoicePdfData(
  session: DashboardSession,
  invoiceId: string,
): Promise<RepairInvoicePdfData | null> {
  const scope = branchScopeFromSession(session);
  const invoice = await prisma.repairInvoice.findFirst({
    where: { id: invoiceId, ...repairInvoiceWhereFromScope(scope, session.companyId) },
    select: {
      id: true,
      invoiceNumber: true,
      currency: true,
      subtotalCents: true,
      taxCents: true,
      discountCents: true,
      totalCents: true,
      issuedAt: true,
      dueAt: true,
      quote: {
        select: {
          title: true,
          lineItems: {
            orderBy: { sortOrder: "asc" },
            select: {
              label: true,
              description: true,
              quantity: true,
              unitPriceCents: true,
            },
          },
          inspection: {
            select: {
              inspectionType: { select: { name: true } },
              company: {
                select: {
                  name: true,
                  logoUrl: true,
                  reportEmail: true,
                  reportPhone: true,
                  reportAddress: true,
                },
              },
              building: {
                select: {
                  name: true,
                  addressLine1: true,
                  city: true,
                  customer: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!invoice) return null;

  const quote = invoice.quote;
  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    quoteTitle: quote.title ?? `${quote.inspection.inspectionType.name} repair invoice`,
    currency: invoice.currency,
    subtotalCents: invoice.subtotalCents,
    taxCents: invoice.taxCents,
    discountCents: invoice.discountCents,
    totalCents: invoice.totalCents,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    companyName: quote.inspection.company.name,
    logoUrl: quote.inspection.company.logoUrl,
    reportEmail: quote.inspection.company.reportEmail,
    reportPhone: quote.inspection.company.reportPhone,
    reportAddress: quote.inspection.company.reportAddress,
    customerName: quote.inspection.building.customer.name,
    buildingLabel: buildingLabel(quote.inspection.building),
    inspectionTypeName: quote.inspection.inspectionType.name,
    lineItems: quote.lineItems,
  };
}
