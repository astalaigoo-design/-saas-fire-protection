import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ComplianceReportData } from "@/lib/reports/queries";
import {
  AhjPermitSection,
  CertificateNumberBanner,
  ChecklistResultsSection,
  InspectionSummarySection,
  PhotosSection,
  PropertyAndVisitSection,
  ReportCompanyHeader,
  ReportFooter,
  SignatureSection,
} from "@/lib/reports/templates/report-sections";
import { reportStyles as styles } from "@/lib/reports/templates/shared-styles";

type Nfpa96HoodFormProps = {
  data: ComplianceReportData;
};

export function Nfpa96HoodFormDocument({ data }: Nfpa96HoodFormProps) {
  return (
    <Document title={`NFPA 96 Report — ${data.building.customer.name}`}>
      <Page size="LETTER" style={styles.page}>
        <ReportCompanyHeader data={data} />
        <Text style={styles.formTitle}>Commercial cooking hood inspection report</Text>
        <Text style={styles.formSubtitle}>
          Ventilation control and fire protection · NFPA 96
        </Text>
        <CertificateNumberBanner data={data} />
        <AhjPermitSection data={data} />
        <InspectionSummarySection data={data} />
        <PropertyAndVisitSection data={data} />
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Suppression system test record</Text>
          <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 6 }}>
            Results below document inspection of hood, exhaust, and fixed extinguishing systems per
            NFPA 96 and applicable AHJ requirements.
          </Text>
        </View>
        <ChecklistResultsSection data={data} itemHeader="Hood / suppression item" />
        <PhotosSection data={data} />
        <SignatureSection data={data} />
        <ReportFooter data={data} />
      </Page>
    </Document>
  );
}
