import { Image, Text, View } from "@react-pdf/renderer";
import {
  buildingAddressLines,
  formatReportDate,
  formatResultLabel,
} from "@/lib/reports/format";
import type { ComplianceReportData } from "@/lib/reports/queries";
import { reportStyles as styles } from "@/lib/reports/templates/shared-styles";

export function ReportCompanyHeader({ data }: { data: ComplianceReportData }) {
  const companyLines = [
    ...(data.company.reportAddress
      ? data.company.reportAddress.split(/\r?\n/).map((line) => line.trim())
      : []),
    data.company.reportPhone,
    data.company.reportEmail,
  ].filter((line): line is string => Boolean(line));

  return (
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
  );
}

export function CertificateNumberBanner({ data }: { data: ComplianceReportData }) {
  if (!data.certificateNumber) return null;
  return (
    <View style={styles.certBanner}>
      <Text style={styles.label}>Certificate number</Text>
      <Text style={styles.certNumber}>{data.certificateNumber}</Text>
    </View>
  );
}

export function AhjPermitSection({ data }: { data: ComplianceReportData }) {
  const jurisdictionName = data.jurisdiction?.name ?? data.building.fireDistrict;
  const hasAhj =
    jurisdictionName || data.building.permitNumber || data.building.permitExpiresAt;
  if (!hasAhj) return null;

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Authority having jurisdiction (AHJ)</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          {jurisdictionName ? (
            <>
              <Text style={styles.label}>Jurisdiction</Text>
              <Text style={styles.value}>{jurisdictionName}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.col}>
          {data.building.permitNumber ? (
            <>
              <Text style={styles.label}>Permit / approval number</Text>
              <Text style={styles.value}>{data.building.permitNumber}</Text>
            </>
          ) : null}
          {data.building.permitExpiresAt ? (
            <>
              <Text style={[styles.label, { marginTop: 8 }]}>Permit expires</Text>
              <Text style={styles.value}>
                {formatReportDate(data.building.permitExpiresAt)}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function InspectionSummarySection({ data }: { data: ComplianceReportData }) {
  return (
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
  );
}

export function PropertyAndVisitSection({ data }: { data: ComplianceReportData }) {
  const inspectionDate = data.completedAt ?? data.signedAt ?? data.scheduledAt;
  const buildingLines = buildingAddressLines(data.building);

  return (
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
  );
}

function resultStyle(result: string) {
  if (result === "pass") return styles.resultPass;
  if (result === "fail") return styles.resultFail;
  return styles.resultNa;
}

export function ChecklistResultsSection({
  data,
  itemHeader = "Item",
}: {
  data: ComplianceReportData;
  itemHeader?: string;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Checklist results</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.colItem}>{itemHeader}</Text>
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
  );
}

export function PhotosSection({ data }: { data: ComplianceReportData }) {
  if (data.photos.length === 0) return null;
  return (
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
  );
}

export function SignatureSection({ data }: { data: ComplianceReportData }) {
  return (
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
  );
}

export function ReportFooter({ data }: { data: ComplianceReportData }) {
  const cert = data.certificateNumber ? ` · Certificate ${data.certificateNumber}` : "";
  return (
    <Text style={styles.footer}>
      Fire inspection compliance report · {data.company.name}
      {cert} · Inspection ID {data.id}
    </Text>
  );
}
