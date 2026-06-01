import { sanitizeCompanyLogoForPdf } from "@/lib/reports/pdf-images";

export type PublicCompanyBranding = {
  companyName: string;
  logoUrl: string | null;
  reportPhone: string | null;
  reportEmail: string | null;
};

export function resolvePublicCompanyBranding(company: {
  name: string;
  logoUrl: string | null;
  reportPhone?: string | null;
  reportEmail?: string | null;
}): PublicCompanyBranding {
  return {
    companyName: company.name,
    logoUrl: sanitizeCompanyLogoForPdf(company.logoUrl),
    reportPhone: company.reportPhone?.trim() || null,
    reportEmail: company.reportEmail?.trim() || null,
  };
}

/** `tel:` href — keeps leading + and digits only. */
export function phoneTelHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
}
