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

type Nfpa25SprinklerFormProps = {
  data: ComplianceReportData;
};

export function Nfpa25SprinklerFormDocument({ data }: Nfpa25SprinklerFormProps) {
  return (
    <Document title={`NFPA 25 Report — ${data.building.customer.name}`}>
      <Page size="LETTER" style={styles.page}>
        <ReportCompanyHeader data={data} />
        <Text style={styles.formTitle}>Inspection and testing report</Text>
        <Text style={styles.formSubtitle}>
          Water-based fire protection systems · NFPA 25
        </Text>
        <CertificateNumberBanner data={data} />
        <AhjPermitSection data={data} />
        <InspectionSummarySection data={data} />
        <PropertyAndVisitSection data={data} />
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>System test record</Text>
          <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 6 }}>
            Results below document inspection and testing per NFPA 25 and applicable AHJ
            requirements.
          </Text>
        </View>
        <ChecklistResultsSection data={data} itemHeader="Test / inspection item" />
        <PhotosSection data={data} />
        <SignatureSection data={data} />
        <ReportFooter data={data} />
      </Page>
    </Document>
  );
}
