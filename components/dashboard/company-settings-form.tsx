"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { OperatingMarket } from "@prisma/client";
import {
  updateCompanyProfile,
  type UpdateCompanyProfileState,
} from "@/lib/companies/actions";
import type { CompanyProfile } from "@/lib/companies/queries";
import { OPERATING_MARKET_LABELS } from "@/lib/market/operating-market";
import { compressImageFile } from "@/lib/inspect/compress-image";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CompanySettingsFormProps = {
  company: CompanyProfile;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
      {pending ? "Saving…" : "Save organization"}
    </Button>
  );
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const [state, formAction] = useFormState<UpdateCompanyProfileState | undefined, FormData>(
    updateCompanyProfile,
    undefined,
  );
  const [logoUrl, setLogoUrl] = useState(company.logoUrl ?? "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    if (!file.type.startsWith("image/")) {
      setLogoError("Choose a PNG or JPEG image.");
      return;
    }

    try {
      const dataUrl = await compressImageFile(file, 512, 0.88);
      if (dataUrl.length > 500_000) {
        setLogoError("Logo is too large after compression. Try a smaller image.");
        return;
      }
      setLogoUrl(dataUrl);
    } catch {
      setLogoError("Could not process image.");
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    setLogoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section
      id="company"
      className={cn(
        orgSectionAnchorClass,
        "max-w-2xl rounded-xl border border-border bg-card p-5 shadow-sm",
      )}
      aria-labelledby="company-heading"
    >
      <div className="mb-6">
        <h2 id="company-heading" className="font-heading text-lg font-semibold text-foreground">
          Company profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Name, logo, and report contact details shown on compliance PDFs and customer-facing links.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
      <input type="hidden" name="logoUrl" value={logoUrl} />

      <div className="space-y-2">
        <Label htmlFor="operatingMarket">Operating market</Label>
        <select
          id="operatingMarket"
          name="operatingMarket"
          defaultValue={company.operatingMarket}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {Object.values(OperatingMarket).map((market) => (
            <option key={market} value={market}>
              {OPERATING_MARKET_LABELS[market]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Sets default checklists (NFPA vs BS / UK), currency, and address formats. Reset checklist
          templates per type after changing market.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Company name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={company.name}
          placeholder="Your fire inspection business"
          className="min-h-11"
        />
        <p className="text-xs text-muted-foreground">
          Shown on your dashboard and compliance PDF reports.
        </p>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">Company logo</legend>
        {logoUrl ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={`${company.name} logo preview`}
              className="h-16 w-auto max-w-[12rem] rounded-md border border-border bg-background object-contain p-1"
            />
            <Button type="button" variant="outline" className="min-h-11" onClick={handleRemoveLogo}>
              Remove logo
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No logo yet. It appears at the top of compliance PDF reports.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="logo">Upload logo</Label>
          <Input
            ref={fileInputRef}
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="min-h-11 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
            onChange={handleLogoChange}
          />
          <p className="text-xs text-muted-foreground">PNG or JPEG, square or wide. Max ~350 KB.</p>
        </div>
        {logoError ? (
          <p role="alert" className="text-sm text-destructive">
            {logoError}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Report contact (optional)
        </legend>
        <div className="space-y-2">
          <Label htmlFor="reportEmail">Report email</Label>
          <Input
            id="reportEmail"
            name="reportEmail"
            type="email"
            defaultValue={company.reportEmail ?? ""}
            placeholder="info@yourcompany.com"
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reportPhone">Report phone</Label>
          <Input
            id="reportPhone"
            name="reportPhone"
            type="tel"
            defaultValue={company.reportPhone ?? ""}
            placeholder="+1 (555) 123-4567"
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reportAddress">Report address</Label>
          <Textarea
            id="reportAddress"
            name="reportAddress"
            rows={3}
            defaultValue={company.reportAddress ?? ""}
            placeholder="Street, city, state, ZIP"
          />
        </div>
      </fieldset>

      {state?.ok === false ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          Organization settings saved.
        </p>
      ) : null}

      <SubmitButton />
      </form>
    </section>
  );
}
