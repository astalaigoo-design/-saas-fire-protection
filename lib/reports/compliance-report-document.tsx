import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  buildingAddressLines,
  formatReportDate,
  formatResultLabel,
} from "@/lib/reports/format";
import type { ComplianceReportData } from "@/lib/reports/queries";

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
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  companyMeta: {
    fontSize: 9,
    color: "#475569",
    marginTop: 4,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#b45309",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  block: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  summaryBox: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  summaryPass: {
    color: "#047857",
    fontWeight: "bold",
    fontSize: 12,
  },
  summaryFail: {
    color: "#b91c1c",
    fontWeight: "bold",
    fontSize: 12,
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
  colItem: { width: "46%" },
  nfpaRef: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 1.3,
  },
  colResult: { width: "14%" },
  colNotes: { width: "40%" },
  resultPass: { color: "#047857" },
  resultFail: { color: "#b91c1c" },
  resultNa: { color: "#475569" },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photo: {
    width: "48%",
    height: 140,
    objectFit: "cover",
    borderRadius: 4,
  },
  signature: {
    width: 220,
    height: 80,
    objectFit: "contain",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

type ComplianceReportDocumentProps = {
  data: ComplianceReportData;
};

function resultStyle(result: string) {
  if (result === "pass") return styles.resultPass;
  if (result === "fail") return styles.resultFail;
  return styles.resultNa;
}

export function ComplianceReportDocument({ data }: ComplianceReportDocumentProps) {
  const inspectionDate = data.completedAt ?? data.signedAt ?? data.scheduledAt;
  const buildingLines = buildingAddressLines(data.building);
  const companyLines = [
    ...(data.company.reportAddress
      ? data.company.reportAddress.split(/\r?\n/).map((line) => line.trim())
      : []),
    data.company.reportPhone,
    data.company.reportEmail,
  ].filter((line): line is string => Boolean(line));

  return (
    <Document title={`Compliance Report — ${data.building.customer.name}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{data.company.name}</Text>
            {companyLines.map((line) => (
              <Text key={line} style={styles.companyMeta}>
                {line}
              </Text>
            ))}
          </View>
          {data.company.logoUrl &&
          (data.company.logoUrl.startsWith("data:image/") ||
            data.company.logoUrl.startsWith("http")) ? (
            <Image src={data.company.logoUrl} style={styles.logo} />
          ) : null}
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Inspection summary</Text>
          <View style={[styles.summaryBox, styles.row]}>
            <View style={styles.col}>
              <Text style={data.summary.overallPass ? styles.summaryPass : styles.summaryFail}>
                {data.summary.overallPass ? "OVERALL: PASS" : "OVERALL: FAIL"}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 9 }}>
                {data.summary.pass} pass · {data.summary.fail} fail · {data.summary.na} N/A
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Next inspection due</Text>
              <Text style={styles.value}>{formatReportDate(data.nextInspectionDue)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.block, styles.row]}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Property</Text>
            <Text style={styles.label}>Building owner</Text>
            <Text style={styles.value}>{data.building.customer.name}</Text>
            {data.building.customer.email ? (
              <Text style={[styles.value, { marginTop: 2 }]}>{data.building.customer.email}</Text>
            ) : null}
            <Text style={[styles.label, { marginTop: 8 }]}>Building address</Text>
            {buildingLines.map((line) => (
              <Text key={line} style={styles.value}>
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Visit details</Text>
            <Text style={styles.label}>Inspection type</Text>
            <Text style={styles.value}>{data.inspectionType.name}</Text>
            <Text style={[styles.label, { marginTop: 8 }]}>Date of inspection</Text>
            <Text style={styles.value}>{formatReportDate(inspectionDate)}</Text>
            <Text style={[styles.label, { marginTop: 8 }]}>Inspector</Text>
            <Text style={styles.value}>{data.inspectorName}</Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Checklist results</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Item</Text>
            <Text style={styles.colResult}>Result</Text>
            <Text style={styles.colNotes}>Notes</Text>
          </View>
          {data.items.map((item) => (
            <View key={`${item.sortOrder}-${item.label}`} style={styles.tableRow}>
              <View style={styles.colItem}>
                <Text>{item.label}</Text>
                {item.description ? (
                  <Text style={styles.nfpaRef}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={[styles.colResult, resultStyle(item.result)]}>
                {formatResultLabel(item.result)}
              </Text>
              <Text style={styles.colNotes}>{item.notes ?? "—"}</Text>
            </View>
          ))}
        </View>

        {data.photos.length > 0 ? (
          <View style={styles.block} break={true}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoGrid}>
              {data.photos.map((photo, index) => (
                <View key={`photo-${index}`} style={{ width: "48%" }}>
                  <Image src={photo.url} style={styles.photo} />
                  {photo.caption ? (
                    <Text style={{ fontSize: 8, marginTop: 2 }}>{photo.caption}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Inspector signature</Text>
          {data.signatureData ? (
            <Image src={data.signatureData} style={styles.signature} />
          ) : (
            <Text style={styles.value}>No signature on file.</Text>
          )}
          {data.signedAt ? (
            <Text style={{ fontSize: 8, marginTop: 4, color: "#64748b" }}>
              Signed {formatReportDate(data.signedAt)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.footer}>
          Fire inspection compliance report · {data.company.name} · Inspection ID {data.id}
        </Text>
      </Page>
    </Document>
  );
}
