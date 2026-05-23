"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  updateCompanyProfile,
  type UpdateCompanyProfileState,
} from "@/lib/companies/actions";
import type { CompanyProfile } from "@/lib/companies/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <form action={formAction} className="max-w-lg space-y-6">
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
  );
}
