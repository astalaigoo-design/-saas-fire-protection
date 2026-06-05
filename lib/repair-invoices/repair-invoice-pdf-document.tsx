import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatReportDate } from "@/lib/reports/format";
import type { RepairInvoicePdfData } from "@/lib/repair-invoices/queries";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#f59e0b",
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  docTitle: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 4,
    fontWeight: "bold",
  },
  meta: {
    fontSize: 9,
    color: "#475569",
    marginTop: 8,
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#b45309",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    padding: 6,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: 6,
    fontSize: 9,
  },
  colItem: { width: "44%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  itemDesc: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 1.3,
  },
  totals: {
    marginTop: 16,
    marginLeft: "auto",
    width: "45%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 9,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    fontSize: 11,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 24,
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.4,
  },
});

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

type RepairInvoicePdfDocumentProps = {
  data: RepairInvoicePdfData;
};

export function RepairInvoicePdfDocument({ data }: RepairInvoicePdfDocumentProps) {
  const issuedDate = formatReportDate(data.issuedAt);
  const dueDate = data.dueAt ? formatReportDate(data.dueAt) : null;
  const remitLines = [data.reportEmail, data.reportPhone, data.reportAddress]
    .map((line) => line?.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.docTitle}>INVOICE {data.invoiceNumber}</Text>
            <Text style={styles.meta}>
              Bill to: {data.customerName}
              {"\n"}
              {data.buildingLabel}
              {"\n"}
              {data.inspectionTypeName} · Issued {issuedDate}
              {dueDate ? `\nDue ${dueDate}` : ""}
            </Text>
          </View>
          {data.logoUrl ? <Image src={data.logoUrl} style={styles.logo} /> : null}
        </View>

        <Text style={styles.sectionTitle}>{data.quoteTitle}</Text>
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Item</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {data.lineItems.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.tableRow}>
              <View style={styles.colItem}>
                <Text>{item.label}</Text>
                {item.description ? (
                  <Text style={styles.itemDesc}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>
                {formatCurrency(item.unitPriceCents, data.currency)}
              </Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.quantity * item.unitPriceCents, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(data.subtotalCents, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax</Text>
            <Text>{formatCurrency(data.taxCents, data.currency)}</Text>
          </View>
          {data.discountCents > 0 ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{formatCurrency(data.discountCents, data.currency)}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotal}>
            <Text>Amount due</Text>
            <Text>{formatCurrency(data.totalCents, data.currency)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Invoice for repair work from the fire inspection listed above. Payment is due per your
          agreement with {data.companyName}.
          {remitLines.length > 0
            ? `\nRemit payment or questions to: ${remitLines.join(" · ")}`
            : ""}
        </Text>
      </Page>
    </Document>
  );
}
