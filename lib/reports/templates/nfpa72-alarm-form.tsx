import { Document, Page, Text } from "@react-pdf/renderer";
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

type Nfpa72AlarmFormProps = {
  data: ComplianceReportData;
};

export function Nfpa72AlarmFormDocument({ data }: Nfpa72AlarmFormProps) {
  return (
    <Document title={`NFPA 72 Report — ${data.building.customer.name}`}>
      <Page size="LETTER" style={styles.page}>
        <ReportCompanyHeader data={data} />
        <Text style={styles.formTitle}>Fire alarm system inspection report</Text>
        <Text style={styles.formSubtitle}>
          Fire alarm and signaling systems · NFPA 72
        </Text>
        <CertificateNumberBanner data={data} />
        <AhjPermitSection data={data} />
        <InspectionSummarySection data={data} />
        <PropertyAndVisitSection data={data} />
        <ChecklistResultsSection data={data} itemHeader="Device / circuit test" />
        <PhotosSection data={data} />
        <SignatureSection data={data} />
        <ReportFooter data={data} />
      </Page>
    </Document>
  );
}
