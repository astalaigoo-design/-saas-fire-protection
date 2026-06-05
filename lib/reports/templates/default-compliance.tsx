import { Document, Page } from "@react-pdf/renderer";
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

type DefaultComplianceDocumentProps = {
  data: ComplianceReportData;
};

export function DefaultComplianceDocument({ data }: DefaultComplianceDocumentProps) {
  return (
    <Document title={`Compliance Report — ${data.building.customer.name}`}>
      <Page size="LETTER" style={styles.page}>
        <ReportCompanyHeader data={data} />
        <CertificateNumberBanner data={data} />
        <InspectionSummarySection data={data} />
        <AhjPermitSection data={data} />
        <PropertyAndVisitSection data={data} />
        <ChecklistResultsSection data={data} />
        <PhotosSection data={data} />
        <SignatureSection data={data} />
        <ReportFooter data={data} />
      </Page>
    </Document>
  );
}
