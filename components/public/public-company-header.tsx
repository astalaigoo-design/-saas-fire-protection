import {
  phoneTelHref,
  type PublicCompanyBranding,
} from "@/lib/companies/public-branding";

type PublicCompanyHeaderProps = {
  branding: PublicCompanyBranding;
};

export function PublicCompanyHeader({ branding }: PublicCompanyHeaderProps) {
  const tel = branding.reportPhone ? phoneTelHref(branding.reportPhone) : "";

  return (
    <header className="flex flex-col items-center gap-4 text-center">
      {branding.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt=""
          className="h-16 max-w-[200px] object-contain sm:h-20"
        />
      ) : null}
      <div className="space-y-1">
        <p className="font-heading text-xl font-semibold text-white">{branding.companyName}</p>
        {branding.reportPhone ? (
          <p className="text-sm text-slate-300">
            {tel ? (
              <a
                href={tel}
                className="font-medium text-amber-400/90 hover:text-amber-300"
              >
                {branding.reportPhone}
              </a>
            ) : (
              branding.reportPhone
            )}
          </p>
        ) : null}
        {branding.reportEmail ? (
          <p className="text-sm text-slate-400">
            <a
              href={`mailto:${branding.reportEmail}`}
              className="hover:text-amber-400/90"
            >
              {branding.reportEmail}
            </a>
          </p>
        ) : null}
      </div>
    </header>
  );
}
